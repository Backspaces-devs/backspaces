# Backspaces Backend (News API)

Express API that reads news from MongoDB (written by
`microservices/news_engine`) and serves it to the frontend.

## Setup

```bash
npm install
cp .env.example .env    # then fill in MONGODB_URI (and anything else you changed)
npm run dev             # dev with hot reload → http://localhost:8000
# or
npm start               # production mode
```

## Endpoints

| Method | Route | Params | Returns |
|---|---|---|---|
| GET | `/health` | — | `{ status, mongo, articles, time }` |
| GET | `/api/news` | `limit` (50, max 100) · `sort` (`date` default — **latest first** / `relevance` / `impact`) · `category` (exact, e.g. `AI & ML`) · `q` (search in heading + description) | JSON array of articles |
| GET | `/api/news/:id` | — | one article, or 404 |

Examples:

```
GET /api/news?limit=20
GET /api/news?sort=relevance
GET /api/news?q=python
GET /api/news?category=AI%20%26%20ML
GET /api/news/3
```

## Behavior notes

- **No server-side cache** — every request reads MongoDB fresh, so a
  "refresh news" button on the frontend is just a re-call of `GET /api/news`.
- **Ordering** — default is latest → oldest. The engine stores `date` as a
  display string ("Sep 18, 2026"), so date sorting happens in the app
  (day precision; ties broken by relevance). If you want exact-time ordering
  later, add a `published_at` ISO field in the engine and this sort moves
  into Mongo.
- **CORS** — only the origins in `CORS_ORIGINS` (default: localhost:3000 +
  backspaces-one.vercel.app) may call the API directly from a browser.
- Errors are centralized: bad input → 400, missing article → 404, Mongo
  unreachable → 503 with a message.
