# My News API

Wrapper that pulls from multiple news sources (NewsAPI, GNews, Mediastack), dedupes stories covered by more than one outlet, scores each for relevance and impact, and caches + saves every response.

## Setup

```bash
pip install -r requirements.txt
export NEWSAPI_KEY=your_key_here       # required — get free key at https://newsapi.org/register
export GNEWS_KEY=your_key_here         # optional — https://gnews.io
export MEDIASTACK_KEY=your_key_here    # optional — https://mediastack.com
uvicorn main:app --reload
```

Only `NEWSAPI_KEY` is required. Any source without a key is silently skipped — the API still works with just one source configured.

## Usage

```
GET /news?topic=ai&limit=10&language=en&sources=newsapi,gnews,mediastack&only_matched=false&sort_by=relevance
```

| Param | Default | Notes |
|---|---|---|
| `topic` | required | search keyword(s) |
| `limit` | 10 | max results **per source**, before dedup |
| `language` | en | ISO language code |
| `sources` | all three | comma-separated: `newsapi,gnews,mediastack` |
| `only_matched` | false | if true, only return stories confirmed by 2+ sources |
| `sort_by` | relevance | `relevance` \| `impact` \| `date` |

Returns:
```json
[
  {
    "id": 1,
    "heading": "GitHub Copilot Adds Repository-Wide Planning",
    "category": "AI Tools",
    "description": "...",
    "content": "...",
    "url": "https://...",
    "source": "GitHub Blog",
    "author": "Maya Patel",
    "date": "Sep 18, 2026",
    "image": "https://...",
    "relevance_score": 80,
    "impact_score": 70
  }
]
```

- **category** — keyword-rule classifier (AI Tools, Technology, Business, Finance, Science, Health, Sports, Politics, Entertainment, General)
- **relevance_score** (0-100) — how strongly the topic keyword matches heading > description > content, plus a freshness bump
- **impact_score** (0-100) — driven by how many independent sources covered the same story (dedup match count), plus a small recency bonus

`GET /health` — shows which sources have keys configured.

## Saved responses

Every non-cached call writes its response to `news_api_responses/news_feed_<YYYYMMDD_HHMMSS>.json`, created automatically next to `main.py`. Cached calls (same query within 5 min) don't write a new file.

## Notes
- Free NewsAPI tier: 100 requests/day, articles delayed ~24h, no commercial use. GNews/Mediastack free tiers have their own limits — check their sites.
- Dedup uses fuzzy title matching (`difflib`, threshold 0.75) — tune in `dedup_articles()` in main.py if it's too aggressive/loose.
- In-memory cache (5 min TTL) — restarts clear it, and it won't be shared across multiple workers if you deploy with more than one.
- Swap `everything` endpoint for `top-headlines` in main.py if you want breaking news by country/category instead of keyword search.
- `news_api_responses/` will grow unbounded over time — add a cleanup job if you run this continuously.
