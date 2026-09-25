"""
news_engine — Backspaces news microservice.

Pipeline (same sources & reference topics as the original script):

  1. Fetch   — RSS feeds (TechCrunch, The Verge, Ars Technica, Wired, InfoQ),
               Hacker News top stories, Dev.to articles (configurable tags)
  2. Dedup   — fuzzy title matching; keeps earliest copy + backfills fields
  3. Score   — sentence-embedding similarity (all-MiniLM-L6-v2) against the
               reference topics; keep items at/above THRESHOLD
  4. Shape   — final article objects, sorted by relevance
  5. Save    — data/response.json (overwritten on each run) and, if
               MONGODB_URI is configured, the releventNews MongoDB
               collection (upserted by URL — the library grows over
               time; rerunning refreshes articles in place)

Run it two ways:

  # 1. Script mode — one-off run
  python main.py

  # 2. API mode
  uvicorn main:app --reload
  # GET /news?limit=20
  # GET /health

No API keys required — all sources are public.
First run downloads the MiniLM model (~90 MB), afterwards it's cached.

Configuration is loaded from environment variables / a .env file
(see .env.example). All fetches (RSS, Hacker News, Dev.to) run
concurrently using httpx.AsyncClient for lower end-to-end latency.
"""

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
from pymongo import ReplaceOne
from pydantic import BaseModel
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
    devto_id: Optional[int] = None     # Dev.to article id — needed to fetch the full body
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
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html_mod.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def markdown_to_text(md: str) -> str:
    """Flatten markdown to readable plain text for the news dialog.

    Keeps paragraph breaks (the dialog renders with whitespace-pre-wrap),
    strips markdown syntax. No new dependencies."""
    text = md or ""
    text = re.sub(r"\A---\n.*?\n---\n?", "", text, flags=re.S)  # YAML frontmatter block
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)         # ![images](url)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)     # [links](url) → label
    text = re.sub(r"^```[^\n]*\n?", "", text, flags=re.M)    # code fences (code kept)
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.M)  # # headings
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)           # **bold**
    text = re.sub(r"\*([^*\n]+)\*", r"\1", text)             # *italic*
    text = re.sub(r"^\s*[-*+]\s+", "• ", text, flags=re.M)   # - bullets
    text = re.sub(r"^>\s?", "", text, flags=re.M)            # > quotes
    text = re.sub(r"\n{3,}", "\n\n", text)                   # collapse blank runs
    return text.strip()


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
#
# RSS: feedparser has no native async API, so each feed is downloaded with
# httpx (async, non-blocking) and then parsed with feedparser from the raw
# bytes already in memory (fast, CPU-only — no additional network I/O).
#
# Hacker News: story IDs are fetched once, then individual stories are
# fetched concurrently (bounded by HN_CONCURRENCY) instead of sequentially.
#
# Dev.to: one request per tag, all issued concurrently.

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
            full_html = (entry.get("content") or [{}])[0].get("value", "")
            ts = entry.get("published_parsed") or entry.get("updated_parsed")
            items.append(RawArticle(
                title=entry.get("title", ""),
                source=source,
                url=entry.get("link", ""),
                published_at=datetime.fromtimestamp(calendar.timegm(ts), tz=timezone.utc) if ts else None,
                description=summary or None,
                content=clean_html(full_html) or summary or None,
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
            description=text or None,
            content=text or None,
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
            description = article.get("description") or None
            items.append(RawArticle(
                title=article.get("title", ""),
                source="Dev.to",
                url=article.get("url", ""),
                published_at=parse_iso_date(article.get("published_at", "")),
                description=description,
                content=article.get("body_markdown") or description,
                author=(article.get("user") or {}).get("name") or None,
                image=article.get("cover_image") or None,
                signal=article.get("positive_reactions_count", 0),
                devto_id=article.get("id"),
            ))
        return items

    results = await asyncio.gather(*(fetch_tag(tag) for tag in DEV_TO_TAGS))
    return [item for sublist in results for item in sublist]


FETCHERS = [fetch_rss, fetch_hn, fetch_devto]


async def enrich_devto_content(kept: list[RawArticle]) -> None:
    """Fetch full article bodies for the kept Dev.to items.

    The tag listing endpoint never includes body_markdown — only the
    single-article endpoint (dev.to/api/articles/{id}, also keyless) does —
    so fetch it for the few items that survived scoring and replace the
    teaser content. Runs after scoring so it costs ~1 request per kept
    Dev.to article, not per fetched one. Failures keep the teaser."""
    targets = [a for a in kept if a.source == "Dev.to" and a.devto_id]
    if not targets:
        return

    sem = asyncio.Semaphore(5)  # be polite to the Dev.to API
    done = 0

    async def fetch_body(client: httpx.AsyncClient, article: RawArticle) -> None:
        nonlocal done
        try:
            async with sem:
                resp = await client.get(
                    f"https://dev.to/api/articles/{article.devto_id}",
                    timeout=REQUEST_TIMEOUT,
                )
            resp.raise_for_status()
            body = (resp.json() or {}).get("body_markdown")
            if body:
                article.content = markdown_to_text(body)
                done += 1
        except Exception as e:
            logger.warning("Dev.to body fetch failed (id %s): %s", article.devto_id, e)

    async with httpx.AsyncClient(headers={"User-Agent": "news-engine/3.1"}) as client:
        await asyncio.gather(*(fetch_body(client, a) for a in targets))
    logger.info("Dev.to full bodies fetched: %d/%d", done, len(targets))

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
    return Article(
        id=idx,
        heading=raw.title,
        category=raw.category,
        description=raw.description,
        content=raw.content,
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

    top = kept[:limit]
    await enrich_devto_content(top)

    return [to_final_article(i + 1, item) for i, item in enumerate(top)]


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
    """Upsert this run's articles into the releventNews collection.

    The collection is the growing news library — articles from previous
    runs are kept, nothing is deleted. An article whose URL is already in
    the library gets its fields refreshed in place and keeps its numeric id
    (so the full-body enrichment replaces old truncated teasers); genuinely
    new articles receive fresh, ever-incrementing ids. No-op (with a
    warning) if MONGODB_URI isn't configured, so Mongo saving is optional."""
    if not MONGODB_URI:
        logger.warning("MONGODB_URI not set — skipping MongoDB save.")
        return 0

    docs = [a.model_dump() for a in articles]
    if not docs:
        logger.warning("No articles this run — leaving Mongo untouched.")
        return 0

    client = get_mongo_client()
    collection = client[MONGO_DB_NAME][MONGO_COLLECTION_NAME]

    # Self-heal: runs from older engine versions may have left duplicate `id`
    # values (per-run numbering) or docs where _id != id. Keep the first doc of
    # each duplicated id; push the extras (and the counter base) above both the
    # max `id` field and the max numeric `_id`, so new ids can never collide
    # with a legacy slot again. Runs only when duplicates exist.
    dup_ids = [
        g["_id"]
        async for g in collection.aggregate([
            {"$group": {"_id": "$id", "n": {"$sum": 1}}},
            {"$match": {"n": {"$gt": 1}}},
        ])
    ]
    if dup_ids:
        top_id = await collection.find_one({}, sort=[("id", -1)], projection={"_id": 0, "id": 1})
        top_oid = await collection.find_one({"_id": {"$type": "number"}}, sort=[("_id", -1)], projection={"_id": 1})
        seq = max(top_id["id"] if top_id else 0, top_oid["_id"] if top_oid else 0) + 1
        healed = 0
        for dup in dup_ids:
            first = True
            async for d in collection.find({"id": dup}, {"_id": 1}).sort("_id", 1):
                if first:
                    first = False
                    continue
                await collection.update_one({"_id": d["_id"]}, {"$set": {"id": seq}})
                seq += 1
                healed += 1
        logger.warning("Self-healed %d duplicate id value(s): %s", healed, dup_ids)

    # Existing articles (by URL) keep their current ids.
    urls = [d["url"] for d in docs]
    existing = {
        doc["url"]: doc["id"]
        async for doc in collection.find({"url": {"$in": urls}}, {"_id": 0, "url": 1, "id": 1})
    }

    # New articles continue from the collection's current max id.
    top = await collection.find_one({}, sort=[("id", -1)], projection={"_id": 0, "id": 1})
    counter = (top["id"] if top else 0) + 1

    ops = []
    new = refreshed = 0
    for doc in docs:
        doc_id = existing.get(doc["url"])
        if doc_id is None:
            doc_id = counter
            counter += 1
            new += 1
        else:
            refreshed += 1
        doc["id"] = doc_id
        doc["_id"] = doc_id  # _id mirrors id — keeps backend /api/news/:id routes working
        ops.append(ReplaceOne({"_id": doc_id}, doc, upsert=True))

    try:
        await collection.bulk_write(ops, ordered=False)
    except Exception as e:
        logger.error("MongoDB save failed: %s", e)
        return 0

    total = await collection.estimated_document_count()
    logger.info(
        "Saved to MongoDB (%s.%s): %d new, %d refreshed — library size %d (nothing deleted)",
        MONGO_DB_NAME, MONGO_COLLECTION_NAME, new, refreshed, total,
    )
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
# `python main.py` — fetches, scores, and saves data/response.json.

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