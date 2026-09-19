"""
news_engine — Backspaces news microservice.

Pipeline (same sources & reference topics as the original script):

  1. Fetch   — RSS feeds (TechCrunch, The Verge, Ars Technica, Wired, InfoQ),
               Hacker News top stories, Dev.to articles (4 tags)
  2. Dedup   — fuzzy title matching; keeps earliest copy + backfills fields
  3. Score   — sentence-embedding similarity (all-MiniLM-L6-v2) against the
               4 reference topics; keep items at/above THRESHOLD (0.35)
  4. Shape   — final article objects, sorted by relevance
  5. Save    — data/response.json (overwritten on each run)

Run it two ways:

  # 1. Script mode — one-off run
  python main.py

  # 2. API mode
  uvicorn main:app --reload
  # GET /news?limit=20
  # GET /health

No API keys required — all sources are public.
First run downloads the MiniLM model (~90 MB), afterwards it's cached.
"""

import asyncio
import calendar
import html as html_mod
import json
import re
import sys
import time
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Optional

import feedparser
import requests
from fastapi import FastAPI, Query
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util

# ---------------- config ----------------

SERVICE_DIR = Path(__file__).resolve().parent

RSS_FEEDS = {
    "TechCrunch": "https://techcrunch.com/feed/",
    "The Verge": "https://www.theverge.com/rss/index.xml",
    "Ars Technica": "https://feeds.arstechnica.com/arstechnica/index",
    "Wired": "https://www.wired.com/feed/rss",
    "InfoQ": "https://feed.infoq.com/",
}

DEV_TO_TAGS = ["machinelearning", "ai", "programming", "webdev"]
DEV_TO_PER_TAG = 15

HN_BASE = "https://hacker-news.firebaseio.com/v0"
HN_LIMIT = 30

REFERENCE_TOPICS = [
    "machine learning models and AI research",
    "new programming languages, frameworks, and developer tools",
    "startup funding and tech industry news",
    "software engineering best practices",
]

# Human-readable label for each reference topic (index-aligned). The topic an
# article matches most strongly becomes its `category`.
TOPIC_CATEGORIES = [
    "AI & ML",
    "Dev Tools",
    "Industry",
    "Engineering",
]

MODEL_NAME = "all-MiniLM-L6-v2"
THRESHOLD = 0.35  # raise for stricter filtering, lower to keep more

REQUEST_TIMEOUT = 10  # seconds, per HTTP request
MAX_ITEMS = 50        # default size of the saved feed
CACHE_TTL = 300       # seconds, in-memory cache (API mode only)
DATA_DIR = SERVICE_DIR / "data"
OUTPUT_FILE = DATA_DIR / "response.json"

app = FastAPI(title="News Engine", version="3.0")

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
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html_mod.unescape(text)
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

# ---------------- fetchers (original sources & URLs) ----------------

def fetch_rss() -> list[RawArticle]:
    items = []
    for source, url in RSS_FEEDS.items():
        feed = feedparser.parse(url)
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


def fetch_hn() -> list[RawArticle]:
    items = []
    resp = requests.get(f"{HN_BASE}/topstories.json", timeout=REQUEST_TIMEOUT)
    top_ids = resp.json()[:HN_LIMIT]
    for story_id in top_ids:
        story = requests.get(f"{HN_BASE}/item/{story_id}.json", timeout=REQUEST_TIMEOUT).json()
        if not story or story.get("type") != "story":
            continue
        text = clean_html(story.get("text", ""))
        items.append(RawArticle(
            title=story.get("title", ""),
            source="Hacker News",
            url=story.get("url", f"https://news.ycombinator.com/item?id={story_id}"),
            published_at=datetime.fromtimestamp(story.get("time", 0), tz=timezone.utc),
            description=text or None,
            content=text or None,
            author=story.get("by") or None,
            image=None,
            signal=story.get("score", 0),
        ))
        time.sleep(0.05)  # be polite to the HN API (as before)
    return items


def fetch_devto() -> list[RawArticle]:
    items = []
    for tag in DEV_TO_TAGS:
        resp = requests.get(
            f"https://dev.to/api/articles?tag={tag}&per_page={DEV_TO_PER_TAG}",
            timeout=REQUEST_TIMEOUT,
        )
        for article in resp.json():
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
            ))
    return items


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
        print(f"news_engine: loading model {MODEL_NAME} (first run downloads it) ...")
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

def run_news_pipeline(limit: int = MAX_ITEMS) -> list[Article]:
    items: list[RawArticle] = []
    for fetcher in FETCHERS:
        try:
            fetched = fetcher()
            print(f"news_engine: {fetcher.__name__} -> {len(fetched)} items")
            items += fetched
        except Exception as e:  # one dead source must not kill the run
            print(f"news_engine: {fetcher.__name__} failed — {e}")

    print(f"news_engine: total fetched: {len(items)}")
    items = dedup_articles(items)

    kept = score_items(items)
    kept.sort(key=lambda x: x.relevance, reverse=True)
    print(f"news_engine: kept {len(kept)} of {len(items)} items above threshold {THRESHOLD}")

    return [to_final_article(i + 1, item) for i, item in enumerate(kept[:limit])]

# ---------------- persistence ----------------

def save_response(articles: list[Article]) -> Path:
    """Write the latest run to data/response.json (overwrites previous run)."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump([a.model_dump() for a in articles], f, indent=2, ensure_ascii=False)
    return OUTPUT_FILE

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

    # Pipeline is sync (feedparser/requests) — run it off the event loop.
    final = await asyncio.to_thread(run_news_pipeline, limit)
    if not final:
        from fastapi import HTTPException
        raise HTTPException(502, "No sources returned results (check your internet connection)")

    set_cached(cache_key, final)
    save_response(final)
    return final


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "sources": {"rss_feeds": list(RSS_FEEDS.keys()), "hacker_news": f"top {HN_LIMIT}", "dev_to_tags": DEV_TO_TAGS},
        "model": MODEL_NAME,
        "threshold": THRESHOLD,
    }

# ---------------- script mode ----------------
# `python main.py` — fetches, scores, and saves data/response.json.

if __name__ == "__main__":
    print("news_engine: fetching feeds ...")
    final = run_news_pipeline()
    if not final:
        print("news_engine: failed — no items passed the filter (check sources / threshold)")
        sys.exit(1)
    path = save_response(final)
    print(f"news_engine: saved {len(final)} articles to {path}")
