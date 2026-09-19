# Microservices

Python services that power Backspaces features. Each service is **one folder
with a single `main.py`** entry point.

| Service        | Purpose | Output |
| :---           | :---    | :---   |
| `news_engine/` | Fetches tech news from RSS feeds (TechCrunch, The Verge, Ars Technica, Wired, InfoQ), Hacker News top stories, and Dev.to (4 tags); dedupes; scores by embedding similarity against 4 reference topics | `news_engine/data/response.json` |

## Conventions

- **One service = one folder = one `main.py`** (FastAPI app + `python main.py`
  script mode). Split into extra modules only when `main.py` gets unwieldy
  (~400+ lines): then `fetchers.py`, `scoring.py`, etc.
- **Shared dependencies** live in `microservices/requirements.txt`. A service
  with extra deps adds its own `<service>/requirements.txt`.
- **Secrets** go in a per-service `.env` (gitignored) when a service needs
  them, with a `.env.example` shipping the variable names. `news_engine`
  needs none — all its sources are public.
- **Generated data** goes in `<service>/data/` (gitignored, keep the folder
  with a `.gitkeep`).
- **Shared code**: when a helper is needed by 2+ services, move it into
  `microservices/common/` (a small Python package). Don't create it
  prematurely for a single service.
- **ML models** live at the repo root in `ml-models/` (not here). Services
  reference models by path or env var.

## Run news_engine

```bash
cd microservices/news_engine

# 1. virtual environment
python3 -m venv .venv
source .venv/bin/activate            # Windows: .\.venv\Scripts\Activate.ps1

# 2. dependencies (first install is heavy: sentence-transformers pulls in torch)
pip install -r ../requirements.txt

# 3. run — first run downloads the MiniLM model (~90 MB), then cached
python main.py
# -> microservices/news_engine/data/response.json
```

API mode instead of script mode:

```bash
uvicorn main:app --reload
# GET /news?limit=20
# GET /health
```

## Pipeline

```
RSS (5 feeds) ─┐
HN top 30 ─────┼─► dedup (fuzzy title, 0.75) ─► embedding relevance
Dev.to (4 tags)┘      keeps earliest +         vs 4 reference topics
                                 backfills fields    keeps ≥ 0.35
                                                          │
                          data/response.json ◄─ sort by relevance ◄┘
```

Response shape (array, one object per article):

```json
{
  "id": 1,
  "heading": "...",
  "category": "AI & ML",
  "description": "...",
  "content": "...",
  "url": "https://...",
  "source": "TechCrunch",
  "author": "Maya Patel",
  "date": "Sep 18, 2026",
  "image": "https://...",
  "relevance_score": 80,
  "impact_score": 70
}
```

- **relevance_score** (0–100) — max cosine similarity of
  `title + description` (all-MiniLM-L6-v2) against the 4 reference topics,
  x100. Items below `THRESHOLD = 0.35` are dropped.
- **category** — the reference topic that matched most strongly
  (AI & ML / Dev Tools / Industry / Engineering).
- **impact_score** (0–100) — audience signal (HN points / Dev.to upvotes,
  x2 capped at 100; RSS has no signal so it gets a neutral 50) + recency
  bonus (+10 if ≤ 6h old, +5 if ≤ 24h).
- **date** — normalized to UTC at fetch, displayed as `%b %d, %Y`.

## Notes

- All sources are public — no API keys, no rate limits to manage. HN fetches
  are politely throttled (50 ms between requests, as in the original).
- Dedup uses fuzzy title matching (`difflib`, threshold 0.75) — tune in
  `dedup_articles()` if too aggressive/loose. Catches cross-feed repeats and
  Dev.to posts that appear under multiple tags.
- If a feed is down, the run logs it and continues with the others.
- In-memory cache (5 min TTL) in API mode: clears on restart, not shared
  across workers. Swap for Redis if you deploy with multiple workers.
- `data/response.json` is overwritten on every run — the latest feed wins.
