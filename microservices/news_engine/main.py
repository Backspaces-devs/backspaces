import asyncio
import calendar
import html as html_mod
import json
import logging
import os
import re
import sys
import time
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Optional

import feedparser
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from pymongo import UpdateOne
from sentence_transformers import SentenceTransformer, util

# ---------------- config ----------------

load_dotenv()  # reads a .env file in the working directory, if present

SERVICE_DIR = Path(__file__).resolve().parent

def _env_list(name: str, default: list[str]) -> list[str]:
    raw = os.getenv(name)
    if not raw:
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]


def _env_list_piped(name: str, default: list[str]) -> list[str]:
    """Like _env_list, but splits on '|' instead of ','. Use this for values
    that may themselves contain commas (e.g. free-text topic descriptions)."""
    raw = os.getenv(name)
    if not raw:
        return default
    return [item.strip() for item in raw.split("|") if item.strip()]


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default

DEFAULT_RSS_FEEDS = {
    "TechCrunch": "https://techcrunch.com/feed/",
    "The Verge": "https://www.theverge.com/rss/index.xml",
    "Ars Technica": "https://feeds.arstechnica.com/arstechnica/index",
    "Wired": "https://www.wired.com/feed/rss",
    "InfoQ": "https://feed.infoq.com/",
}

# RSS_FEEDS can be overridden via env as "Name1|url1,Name2|url2"
_rss_env = os.getenv("RSS_FEEDS")
if _rss_env:
    RSS_FEEDS = dict(pair.split("|", 1) for pair in _rss_env.split(",") if "|" in pair)
else:
    RSS_FEEDS = DEFAULT_RSS_FEEDS

DEV_TO_TAGS = _env_list("DEV_TO_TAGS", ["machinelearning", "ai", "programming", "webdev"])
DEV_TO_PER_TAG = _env_int("DEV_TO_PER_TAG", 15)

HN_BASE = os.getenv("HN_BASE", "https://hacker-news.firebaseio.com/v0")
HN_LIMIT = _env_int("HN_LIMIT", 30)
HN_CONCURRENCY = _env_int("HN_CONCURRENCY", 10)  # simultaneous HN item requests

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("news_engine")

_DEFAULT_REFERENCE_TOPICS = [
    "machine learning models and AI research",
    "new programming languages, frameworks, and developer tools",
    "startup funding and tech industry news",
    "software engineering best practices",
]
_DEFAULT_TOPIC_CATEGORIES = [
    "AI & ML",
    "Dev Tools",
    "Industry",
    "Engineering",
]

# Piped ('|'), not comma-separated — topic text itself may contain commas
# (e.g. "new languages, frameworks, and tools"), which would otherwise split
# a single topic into several and desync it from TOPIC_CATEGORIES.
REFERENCE_TOPICS = _env_list_piped("REFERENCE_TOPICS", _DEFAULT_REFERENCE_TOPICS)
TOPIC_CATEGORIES = _env_list_piped("TOPIC_CATEGORIES", _DEFAULT_TOPIC_CATEGORIES)

if len(REFERENCE_TOPICS) != len(TOPIC_CATEGORIES):
    logger.error(
        "REFERENCE_TOPICS (%d items) and TOPIC_CATEGORIES (%d items) must be "
        "the same length — falling back to defaults for both. Check your "
        ".env: use '|' to separate topics, not ','.",
        len(REFERENCE_TOPICS), len(TOPIC_CATEGORIES),
    )
    REFERENCE_TOPICS = _DEFAULT_REFERENCE_TOPICS
    TOPIC_CATEGORIES = _DEFAULT_TOPIC_CATEGORIES

MODEL_NAME = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
THRESHOLD = _env_float("THRESHOLD", 0.35)  # raise for stricter filtering, lower to keep more

REQUEST_TIMEOUT = _env_float("REQUEST_TIMEOUT", 10.0)  # seconds, per HTTP request
MAX_ITEMS = _env_int("MAX_ITEMS", 50)                  # default size of the saved feed
CACHE_TTL = _env_int("CACHE_TTL", 300)                 # seconds, in-memory cache (API mode only)
DATA_DIR = SERVICE_DIR / "data"
OUTPUT_FILE = DATA_DIR / "response.json"

# --- MongoDB (Atlas) ---
# Full connection string from Atlas (Cluster0 > Connect > Drivers).
# Leave empty to disable Mongo saving entirely (file save still happens).
MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "News")
MONGO_COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME", "releventNews")

app = FastAPI(title="News Engine", version="3.1")

# ---------------- models ----------------

# Internal working record (before scoring / final shaping)
class RawArticle(BaseModel):
    title: str
    source: str
    url: str
    published_at: Optional[datetime] = None  # normalized to UTC
    description: Optional[str] = None  # short text (also used for scoring)
    content: Optional[str] = None      # full text for display
    author: Optional[str] = None
    image: Optional[str] = None
    signal: Optional[int] = None       # HN points / Dev.to upvotes (RSS: none)
    matched_sources: list[str] = []
    relevance: Optional[float] = None  # 0-1 cosine similarity, filled by scorer
    category: str = "General"

# Final response shape (one element of data/response.json)
class Article(BaseModel):
    id: int
    heading: str
    category: str
    description: Optional[str]
    content: Optional[str]
    url: str
    source: str
    author: Optional[str]
    date: str
    image: Optional[str]
    relevance_score: int
    impact_score: int

# ---------------- small helpers ----------------

def clean_html(text: str) -> str:
    """Strip tags, unescape entities, collapse whitespace."""
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Unescape HTML entities like &amp;
    text = html_mod.unescape(text)
    # Collapse multiple whitespaces into a single space
    return re.sub(r"\s+", " ", text).strip()


def first_image_url(entry) -> Optional[str]:
    for enc in entry.get("enclosures") or []:
        href = enc.get("href")
        if href and "image" in (enc.get("type") or ""):
            return href
    for mc in entry.get("media_content") or []:
        if mc.get("url"):
            return mc["url"]
    return None


def parse_iso_date(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

# ---------------- fetchers (async, run concurrently) ----------------

async def fetch_rss(client: httpx.AsyncClient) -> list[RawArticle]:
    async def fetch_one(source: str, url: str) -> list[RawArticle]:
        items = []
        try:
            resp = await client.get(url, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            feed = feedparser.parse(resp.content)
        except Exception as e:
            logger.warning("RSS fetch failed for %s (%s): %s", source, url, e)
            return items

        for entry in feed.entries:
            summary = clean_html(entry.get("summary", ""))
            
            # Try to get the fullest content available in the RSS feed
            full_html = ""
            if "content" in entry and entry.content:
                full_html = entry.content[0].get("value", "")
            elif "description" in entry:
                full_html = entry.description

            content = clean_html(full_html)
            
            ts = entry.get("published_parsed") or entry.get("updated_parsed")
            items.append(RawArticle(
                title=entry.get("title", ""),
                source=source,
                url=entry.get("link", ""),
                published_at=datetime.fromtimestamp(calendar.timegm(ts), tz=timezone.utc) if ts else None,
                description=summary or content[:500] + "..." if content else None, # Fallback description
                content=content or summary or None, # Ensure we save the full content if found
                author=entry.get("author") or None,
                image=first_image_url(entry),
            ))
        return items

    results = await asyncio.gather(*(fetch_one(src, url) for src, url in RSS_FEEDS.items()))
    return [item for sublist in results for item in sublist]


async def fetch_hn(client: httpx.AsyncClient) -> list[RawArticle]:
    resp = await client.get(f"{HN_BASE}/topstories.json", timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    top_ids = resp.json()[:HN_LIMIT]

    semaphore = asyncio.Semaphore(HN_CONCURRENCY)

    async def fetch_story(story_id: int) -> Optional[RawArticle]:
        async with semaphore:
            try:
                r = await client.get(f"{HN_BASE}/item/{story_id}.json", timeout=REQUEST_TIMEOUT)
                r.raise_for_status()
                story = r.json()
            except Exception as e:
                logger.warning("HN item %s failed: %s", story_id, e)
                return None

        if not story or story.get("type") != "story":
            return None

        text = clean_html(story.get("text", ""))
        return RawArticle(
            title=story.get("title", ""),
            source="Hacker News",
            url=story.get("url", f"https://news.ycombinator.com/item?id={story_id}"),
            published_at=datetime.fromtimestamp(story.get("time", 0), tz=timezone.utc),
            description=text[:500] + "..." if len(text) > 500 else text or None,
            content=text or None, # Hacker news usually only has 'text' for self posts, links go elsewhere
            author=story.get("by") or None,
            image=None,
            signal=story.get("score", 0),
        )

    results = await asyncio.gather(*(fetch_story(sid) for sid in top_ids))
    return [item for item in results if item is not None]


async def fetch_devto(client: httpx.AsyncClient) -> list[RawArticle]:
    async def fetch_tag(tag: str) -> list[RawArticle]:
        items = []
        try:
            # Note: The /articles endpoint returns a summary. 
            # To get full content, you technically need to hit /articles/{id} for each,
            # but that requires many API calls. We will rely on 'body_markdown' if it's there,
            # or 'description' as fallback.
            resp = await client.get(
                "https://dev.to/api/articles",
                params={"tag": tag, "per_page": DEV_TO_PER_TAG},
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            articles = resp.json()
        except Exception as e:
            logger.warning("Dev.to fetch failed for tag %s: %s", tag, e)
            return items

        for article in articles:
            # Some APIs give excerpts in description.
            description = article.get("description") or ""
            # Dev.to list API might return body_markdown, if not, we fallback.
            body_markdown = article.get("body_markdown") or description
            
            # Clean up content to remove formatting if desired, or keep as is.
            # Keeping as is here, but stripping HTML just in case.
            clean_content = clean_html(body_markdown)

            items.append(RawArticle(
                title=article.get("title", ""),
                source="Dev.to",
                url=article.get("url", ""),
                published_at=parse_iso_date(article.get("published_at", "")),
                description=description or clean_content[:500] + "..." if clean_content else None,
                content=clean_content or None, 
                author=(article.get("user") or {}).get("name") or None,
                image=article.get("cover_image") or None,
                signal=article.get("positive_reactions_count", 0),
            ))
        return items

    results = await asyncio.gather(*(fetch_tag(tag) for tag in DEV_TO_TAGS))
    return [item for sublist in results for item in sublist]


FETCHERS = [fetch_rss, fetch_hn, fetch_devto]

# ---------------- dedup ----------------

def title_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def dedup_articles(articles: list[RawArticle], threshold: float = 0.75) -> list[RawArticle]:
    """Group near-duplicate titles (e.g. same story in two feeds, or one Dev.to
    post under two tags); keep the earliest copy and backfill its missing
    fields (content / author / image) from the other copies."""
    groups: list[list[RawArticle]] = []
    for art in articles:
        placed = False
        for group in groups:
            if title_similarity(art.title, group[0].title) >= threshold:
                group.append(art)
                placed = True
                break
        if not placed:
            groups.append([art])

    merged = []
    for group in groups:
        rep = min(group, key=lambda a: a.published_at or datetime.max.replace(tzinfo=timezone.utc))
        rep.matched_sources = sorted({a.source for a in group})
        for a in group:
            if not rep.content and a.content:
                rep.content = a.content
            if not rep.author and a.author:
                rep.author = a.author
            if not rep.image and a.image:
                rep.image = a.image
        merged.append(rep)
    return merged

# ---------------- relevance scoring (embeddings, original approach) ----------------

_model: Optional[SentenceTransformer] = None


def get_model() -> SentenceTransformer:
    """Load the embedding model once per process."""
    global _model
    if _model is None:
        logger.info("Loading model %s (first run downloads it) ...", MODEL_NAME)
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def score_items(items: list[RawArticle]) -> list[RawArticle]:
    """Score every item against REFERENCE_TOPICS (batched), tag it with the
    best-matching topic as its category, and keep items at/above THRESHOLD."""
    model = get_model()
    reference_embeddings = model.encode(REFERENCE_TOPICS, convert_to_tensor=True)

    texts = []
    for item in items:
        text = f"{item.title} {item.description or ''}".strip()
        texts.append(text if text else " ")
    item_embeddings = model.encode(texts, convert_to_tensor=True)
    similarities = util.cos_sim(item_embeddings, reference_embeddings)  # (N, len(topics))

    kept = []
    for item, row in zip(items, similarities):
        if not (f"{item.title} {item.description or ''}".strip()):
            item.relevance = 0.0  # nothing to score (same as the original)
        else:
            item.relevance = float(row.max())
            item.category = TOPIC_CATEGORIES[int(row.argmax())]
        if item.relevance >= THRESHOLD:
            kept.append(item)
    return kept

# ---------------- impact scoring ----------------

def impact_score(item: RawArticle) -> int:
    """0-100. Audience signal (HN points / Dev.to upvotes, scaled x2 and
    capped at 100) plus a recency bonus. RSS items have no public signal,
    so they get a neutral 50 base."""
    if item.signal is None:
        engagement = 50
    else:
        engagement = min(100, item.signal * 2)

    bonus = 0
    if item.published_at:
        age_hours = (datetime.now(timezone.utc) - item.published_at).total_seconds() / 3600
        if 0 <= age_hours <= 6:
            bonus = 10
        elif 0 <= age_hours <= 24:
            bonus = 5

    return max(0, min(100, engagement + bonus))

# ---------------- shaping ----------------

def format_date(published_at: Optional[datetime]) -> str:
    if not published_at:
        return "Unknown"
    return published_at.strftime("%b %d, %Y")


def to_final_article(idx: int, raw: RawArticle) -> Article:
    # Provide a graceful fallback for link-only posts (like HN) to prevent empty UI cards
    fallback_text = f"Article shared via {raw.source}. Visit the source link to read the full story."
    
    return Article(
        id=idx,
        heading=raw.title,
        category=raw.category,
        description=raw.description or fallback_text,
        content=raw.content or raw.description or fallback_text,
        url=raw.url,
        source=raw.source,
        author=raw.author,
        date=format_date(raw.published_at),
        image=raw.image,
        relevance_score=int(round((raw.relevance or 0.0) * 100)),
        impact_score=impact_score(raw),
    )

# ---------------- pipeline ----------------

async def run_news_pipeline_async(limit: int = MAX_ITEMS) -> list[Article]:
    items: list[RawArticle] = []
    async with httpx.AsyncClient(headers={"User-Agent": "news-engine/3.1"}) as client:
        results = await asyncio.gather(
            *(fetcher(client) for fetcher in FETCHERS),
            return_exceptions=True,
        )

    for fetcher, result in zip(FETCHERS, results):
        if isinstance(result, Exception):
            logger.error("%s failed entirely: %s", fetcher.__name__, result)
            continue
        logger.info("%s -> %d items", fetcher.__name__, len(result))
        items += result

    logger.info("Total fetched: %d", len(items))
    items = dedup_articles(items)

    kept = score_items(items)
    kept.sort(key=lambda x: x.relevance, reverse=True)
    logger.info("Kept %d of %d items above threshold %.2f", len(kept), len(items), THRESHOLD)

    return [to_final_article(i + 1, item) for i, item in enumerate(kept[:limit])]


def run_news_pipeline(limit: int = MAX_ITEMS) -> list[Article]:
    """Sync wrapper — used by script mode (`python main.py`)."""
    return asyncio.run(run_news_pipeline_async(limit))

# ---------------- persistence ----------------

def save_response(articles: list[Article]) -> Path:
    """Write the latest run to data/response.json (overwrites previous run)."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump([a.model_dump() for a in articles], f, indent=2, ensure_ascii=False)
    return OUTPUT_FILE

# ---------------- MongoDB (Atlas) persistence ----------------

_mongo_client: Optional[AsyncIOMotorClient] = None


def get_mongo_client() -> AsyncIOMotorClient:
    """Lazily create a single shared Motor client for the process lifetime."""
    global _mongo_client
    if _mongo_client is None:
        if not MONGODB_URI:
            raise RuntimeError(
                "MONGODB_URI is not set. Add it to your .env — see .env.example."
            )
        _mongo_client = AsyncIOMotorClient(MONGODB_URI)
    return _mongo_client


async def save_to_mongo(articles: list[Article]) -> int:
    """Upserts this run's articles to the releventNews collection.
    Uses the article URL to prevent duplicates, allowing the DB to grow.
    Returns the number of documents processed. No-op if MONGODB_URI isn't configured."""
    if not MONGODB_URI:
        logger.warning("MONGODB_URI not set — skipping MongoDB save.")
        return 0

    client = get_mongo_client()
    collection = client[MONGO_DB_NAME][MONGO_COLLECTION_NAME]

    docs = [a.model_dump() for a in articles]
    operations = []
    
    for doc in docs:
        # We use the article's URL as the unique identifier.
        # If the URL exists, it updates the record. If not, it inserts it.
        operations.append(
            UpdateOne({"url": doc["url"]}, {"$set": doc}, upsert=True)
        )

    try:
        if operations:
            result = await collection.bulk_write(operations)
            logger.info(
                "MongoDB sync complete: %d new inserted, %d existing updated in %s.%s",
                result.upserted_count, result.modified_count, MONGO_DB_NAME, MONGO_COLLECTION_NAME
            )
    except Exception as e:
        logger.error("MongoDB save failed: %s", e)
        return 0

    return len(docs)


async def close_mongo_client() -> None:
    global _mongo_client
    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None

# ---------------- in-memory cache (API mode only) ----------------

_cache: dict = {}


def get_cached(key: str):
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < CACHE_TTL:
        return entry["data"]
    return None


def set_cached(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}

# ---------------- API endpoints ----------------

@app.get("/news", response_model=list[Article])
async def get_news(limit: int = Query(MAX_ITEMS, le=100, description="Max articles in the response")):
    cache_key = f"news:{limit}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    final = await run_news_pipeline_async(limit)
    if not final:
        raise HTTPException(502, "No sources returned results (check your internet connection)")

    set_cached(cache_key, final)
    save_response(final)
    await save_to_mongo(final)
    return final


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "sources": {"rss_feeds": list(RSS_FEEDS.keys()), "hacker_news": f"top {HN_LIMIT}", "dev_to_tags": DEV_TO_TAGS},
        "model": MODEL_NAME,
        "threshold": THRESHOLD,
        "mongo_configured": bool(MONGODB_URI),
    }


@app.on_event("shutdown")
async def _on_shutdown():
    await close_mongo_client()

# ---------------- script mode ----------------
# `python main.py` — fetches, scores, saves data/response.json, and (if
# MONGODB_URI is set) writes the same articles to the releventNews collection.

async def _script_main() -> None:
    logger.info("Fetching feeds ...")
    final = await run_news_pipeline_async(MAX_ITEMS)
    if not final:
        logger.error("Failed — no items passed the filter (check sources / threshold)")
        sys.exit(1)
    path = save_response(final)
    logger.info("Saved %d articles to %s", len(final), path)
    await save_to_mongo(final)
    await close_mongo_client()


if __name__ == "__main__":
    asyncio.run(_script_main())