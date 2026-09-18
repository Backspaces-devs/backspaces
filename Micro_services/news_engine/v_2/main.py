import asyncio
import json
import os
import time
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

load_dotenv()  # reads a .env file in this folder, if present

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
GNEWS_KEY = os.getenv("GNEWS_KEY")
MEDIASTACK_KEY = os.getenv("MEDIASTACK_KEY")

app = FastAPI(title="My News API", version="3.0")

# --- where every /news response gets saved as a JSON file ---
RESPONSES_DIR = Path(__file__).parent / "news_api_responses"
RESPONSES_DIR.mkdir(exist_ok=True)


def save_response_to_disk(articles: list) -> str:
    """
    Writes the response JSON to news_api_responses/news_feed_<timestamp>.json
    Returns the filename written.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"news_feed_{timestamp}.json"
    filepath = RESPONSES_DIR / filename
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump([a.model_dump() for a in articles], f, indent=2, ensure_ascii=False)
    return filename

# --- simple in-memory cache (swap for Redis later if needed) ---
_cache: dict = {}
CACHE_TTL = 300  # seconds


def get_cached(key: str):
    entry = _cache.get(key)
    if entry and time.time() - entry["ts"] < CACHE_TTL:
        return entry["data"]
    return None


def set_cached(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}


# --- internal working record (before scoring/final shape) ---
class RawArticle(BaseModel):
    title: str
    source: str
    url: str
    published_at: str  # ISO string from source API, may be ""
    description: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    image: Optional[str] = None
    matched_sources: list[str] = []


# --- final response shape ---
class Article(BaseModel):
    id: int
    heading: str
    category: str
    description: Optional[str] = None
    content: Optional[str] = None
    url: str
    source: str
    author: Optional[str] = None
    date: str
    image: Optional[str] = None
    relevance_score: int
    impact_score: int


# ---------------- per-source fetchers ----------------

async def fetch_newsapi(client: httpx.AsyncClient, topic: str, limit: int, language: str) -> list[RawArticle]:
    if not NEWSAPI_KEY:
        return []
    params = {
        "q": topic, "language": language, "pageSize": limit,
        "sortBy": "publishedAt", "apiKey": NEWSAPI_KEY,
    }
    try:
        resp = await client.get("https://newsapi.org/v2/everything", params=params)
        resp.raise_for_status()
    except httpx.HTTPError:
        return []
    data = resp.json().get("articles", [])
    return [
        RawArticle(
            title=a.get("title") or "",
            source=(a.get("source") or {}).get("name", "NewsAPI"),
            url=a.get("url") or "",
            published_at=a.get("publishedAt") or "",
            description=a.get("description"),
            content=a.get("content"),
            author=a.get("author"),
            image=a.get("urlToImage"),
        )
        for a in data
    ]


async def fetch_gnews(client: httpx.AsyncClient, topic: str, limit: int, language: str) -> list[RawArticle]:
    if not GNEWS_KEY:
        return []
    params = {"q": topic, "lang": language, "max": limit, "apikey": GNEWS_KEY}
    try:
        resp = await client.get("https://gnews.io/api/v4/search", params=params)
        resp.raise_for_status()
    except httpx.HTTPError:
        return []
    data = resp.json().get("articles", [])
    return [
        RawArticle(
            title=a.get("title") or "",
            source=(a.get("source") or {}).get("name", "GNews"),
            url=a.get("url") or "",
            published_at=a.get("publishedAt") or "",
            description=a.get("description"),
            content=a.get("content"),
            author=None,  # GNews doesn't provide author
            image=a.get("image"),
        )
        for a in data
    ]


async def fetch_mediastack(client: httpx.AsyncClient, topic: str, limit: int, language: str) -> list[RawArticle]:
    if not MEDIASTACK_KEY:
        return []
    params = {
        "keywords": topic, "languages": language, "limit": limit,
        "access_key": MEDIASTACK_KEY, "sort": "published_desc",
    }
    try:
        resp = await client.get("http://api.mediastack.com/v1/news", params=params)
        resp.raise_for_status()
    except httpx.HTTPError:
        return []
    data = resp.json().get("data", [])
    return [
        RawArticle(
            title=a.get("title") or "",
            source=a.get("source") or "Mediastack",
            url=a.get("url") or "",
            published_at=a.get("published_at") or "",
            description=a.get("description"),
            content=None,  # Mediastack free tier doesn't return full content
            author=a.get("author"),
            image=a.get("image"),
        )
        for a in data
    ]


SOURCE_FETCHERS = {
    "newsapi": fetch_newsapi,
    "gnews": fetch_gnews,
    "mediastack": fetch_mediastack,
}

# ---------------- dedup ----------------

def title_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def dedup_articles(articles: list[RawArticle], threshold: float = 0.75) -> list[RawArticle]:
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
        rep = min(group, key=lambda a: a.published_at or "9999")
        rep.matched_sources = sorted({a.source for a in group})
        # backfill missing fields from other copies in the group (richer result)
        for a in group:
            if not rep.content and a.content:
                rep.content = a.content
            if not rep.author and a.author:
                rep.author = a.author
            if not rep.image and a.image:
                rep.image = a.image
        merged.append(rep)
    return merged

# ---------------- category classification ----------------
# Cheap keyword-rule classifier. Swap for an LLM call if you want it smarter later.

CATEGORY_KEYWORDS = {
    "AI Tools": ["ai", "artificial intelligence", "copilot", "llm", "chatgpt", "machine learning", "openai", "anthropic", "gemini"],
    "Technology": ["software", "app", "tech", "startup", "gadget", "device", "chip", "semiconductor"],
    "Business": ["market", "stock", "ipo", "acquisition", "merger", "revenue", "funding", "valuation"],
    "Finance": ["finance", "economy", "inflation", "interest rate", "bank", "crypto", "bitcoin"],
    "Science": ["research", "study", "nasa", "space", "physics", "discovery"],
    "Health": ["health", "medical", "disease", "vaccine", "hospital", "drug"],
    "Sports": ["match", "tournament", "league", "cricket", "football", "olympics"],
    "Politics": ["election", "government", "president", "minister", "parliament", "policy"],
    "Entertainment": ["movie", "film", "celebrity", "music", "streaming", "box office"],
    "Crime": ["murder", "homicide", "killed", "stabbing", "shooting", "assault", "robbery", "kidnap", "arrested", "police", "crime scene"],
}


def classify_category(title: str, description: Optional[str]) -> str:
    text = f"{title} {description or ''}".lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return category
    return "General"

# ---------------- scoring ----------------

def parse_date(published_at: str) -> Optional[datetime]:
    if not published_at:
        return None
    try:
        return datetime.fromisoformat(published_at.replace("Z", "+00:00"))
    except ValueError:
        return None


def relevance_score(article: RawArticle, topic: str) -> int:
    """
    0-100. Weighted by where the topic keyword appears:
    title match is the strongest signal, then description, then content.
    Multi-word topics get partial credit per matched word.
    """
    topic_words = [w for w in topic.lower().split() if w]
    if not topic_words:
        return 50

    title = article.title.lower()
    desc = (article.description or "").lower()
    content = (article.content or "").lower()

    score = 0
    for w in topic_words:
        if w in title:
            score += 50 / len(topic_words)
        if w in desc:
            score += 20 / len(topic_words)
        if w in content:
            score += 10 / len(topic_words)

    # freshness nudge: very recent articles are usually more relevant to "what's happening now"
    dt = parse_date(article.published_at)
    if dt:
        age_hours = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
        if age_hours <= 24:
            score += 20
        elif age_hours <= 72:
            score += 10

    return max(0, min(100, round(score)))


def impact_score(article: RawArticle) -> int:
    """
    0-100. Driven mainly by how many independent sources covered the same
    story (cross-source confirmation = bigger real-world story), with a
    small recency boost since breaking news has more immediate impact.
    """
    n = max(1, len(article.matched_sources))
    base = {1: 25, 2: 60, 3: 85}.get(n, 100)

    dt = parse_date(article.published_at)
    bonus = 0
    if dt:
        age_hours = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
        if age_hours <= 6:
            bonus = 10
        elif age_hours <= 24:
            bonus = 5

    return max(0, min(100, base + bonus))


def format_date(published_at: str) -> str:
    dt = parse_date(published_at)
    if not dt:
        return published_at or "Unknown"
    return dt.strftime("%b %d, %Y")


def to_final_article(idx: int, raw: RawArticle, topic: str) -> Article:
    return Article(
        id=idx,
        heading=raw.title,
        category=classify_category(raw.title, raw.description),
        description=raw.description,
        content=raw.content,
        url=raw.url,
        source=raw.source,
        author=raw.author,
        date=format_date(raw.published_at),
        image=raw.image,
        relevance_score=relevance_score(raw, topic),
        impact_score=impact_score(raw),
    )

# ---------------- shared pipeline (used by both the API endpoint and script mode) ----------------

async def run_news_pipeline(
    topic: str,
    limit: int = 10,
    language: str = "en",
    sources: str = "newsapi,gnews,mediastack",
    only_matched: bool = False,
    sort_by: str = "relevance",
) -> list[Article]:
    requested = [s.strip() for s in sources.split(",") if s.strip() in SOURCE_FETCHERS]
    if not requested:
        raise ValueError(f"No valid sources. Choose from: {list(SOURCE_FETCHERS)}")

    async with httpx.AsyncClient(timeout=10) as client:
        results = await asyncio.gather(
            *[SOURCE_FETCHERS[s](client, topic, limit, language) for s in requested]
        )

    all_raw = [a for source_list in results for a in source_list]
    if not all_raw:
        raise RuntimeError("No sources returned results (check API keys / rate limits)")

    deduped = dedup_articles(all_raw)
    if only_matched:
        deduped = [a for a in deduped if len(a.matched_sources) >= 2]

    final = [to_final_article(i + 1, raw, topic) for i, raw in enumerate(deduped)]

    if sort_by == "impact":
        final.sort(key=lambda a: a.impact_score, reverse=True)
    elif sort_by == "date":
        final.sort(key=lambda a: a.date, reverse=True)
    else:
        final.sort(key=lambda a: a.relevance_score, reverse=True)

    for i, a in enumerate(final):
        a.id = i + 1

    return final


# ---------------- endpoint ----------------

@app.get("/news", response_model=list[Article])
async def get_news(
    topic: str = Query(..., description="Keyword to search, e.g. 'ai', 'cricket'"),
    limit: int = Query(10, le=50, description="Max results per source, before dedup"),
    language: str = "en",
    sources: str = Query("newsapi,gnews,mediastack", description="Comma-separated source list"),
    only_matched: bool = Query(False, description="Only return stories confirmed by 2+ sources"),
    sort_by: str = Query("relevance", description="relevance | impact | date"),
):
    cache_key = f"{topic}:{limit}:{language}:{sources}:{only_matched}:{sort_by}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        final = await run_news_pipeline(topic, limit, language, sources, only_matched, sort_by)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except RuntimeError as e:
        raise HTTPException(502, str(e))

    set_cached(cache_key, final)
    save_response_to_disk(final)
    return final


@app.get("/health")
async def health():
    return {"status": "ok", "sources_configured": [s for s, k in [
        ("newsapi", NEWSAPI_KEY), ("gnews", GNEWS_KEY), ("mediastack", MEDIASTACK_KEY)
    ] if k]}


# ---------------- script mode ----------------
# Runs when you hit VSCode's "Run" button (or `python3 main.py` directly)
# instead of starting the API server. Fetches once for a topic and saves
# straight to news_api_responses/ — no browser needed.
#
# Set a topic via: python3 main.py "your topic"
# or by setting DEFAULT_TOPIC in your .env file.

if __name__ == "__main__":
    import sys

    topic = sys.argv[1] if len(sys.argv) > 1 else os.getenv("DEFAULT_TOPIC", "technology")
    print(f"Fetching news for topic: '{topic}' ...")

    try:
        articles = asyncio.run(run_news_pipeline(topic))
    except (ValueError, RuntimeError) as e:
        print(f"Failed: {e}")
        sys.exit(1)

    filename = save_response_to_disk(articles)
    print(f"Saved {len(articles)} articles to news_api_responses/{filename}")