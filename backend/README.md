# Backspaces Backend (News + Practice API)

Express API that:

- reads news from MongoDB (written by `microservices/news_engine`) and serves it to the frontend
- stores the **Problem Solving** page's revision queue (SM-2 spaced repetition) and DSA-sheet progress

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

### Practice endpoints (Problem Solving page)

Every request is scoped by a `user` id (`^[\w.-]{1,64}$`), passed as a query param on
GET/DELETE and in the JSON body on POST/PUT. The Next.js app (`/api/problem-solving/*`)
fills it in from the configured platform usernames, so the browser never calls these directly.

| Method | Route | Body / params | Returns |
|---|---|---|---|
| GET | `/api/revision` | `?user=` | array of tasks, soonest `nextReviewAt` first |
| POST | `/api/revision` | `{ user, title, slug, platform, url, difficulty?, topics?, solvedAt? }` | the task (idempotent — re-adding the same `platform+slug` returns the existing one) |
| POST | `/api/revision/:id/review` | `{ user, quality }` (`0-5`; UI uses Again=1, Hard=3, Good=4, Easy=5) | the rescheduled task |
| DELETE | `/api/revision/:id` | `?user=` | `{ ok: true }` |
| GET | `/api/sheets/progress` | `?user=` | `{ [sheetId]: problemId[] }` |
| PUT | `/api/sheets/progress` | `{ user, sheetId, problemIds: string[], done: boolean }` | the full progress map |

Stored in the database `PRACTICE_DB_NAME` (default `Backspaces`) — collections
`revisionTasks` (unique `user+platform+slug`) and `sheetProgress` (unique `user+sheetId`).
Indexes are created automatically on first use. The news database is not touched.

**SM-2 scheduling** (`src/utils/sm2.js`): quality < 3 resets the repetition count (review again
tomorrow); otherwise intervals go 1 day → 6 days → `interval × easeFactor`, with the ease factor
adjusted per review and floored at 1.3.

## Environment

| Var | Required | Default |
|---|---|---|
| `MONGODB_URI` | yes | — |
| `PORT` | no | `8000` |
| `MONGO_DB_NAME` / `MONGO_COLLECTION_NAME` | no | `News` / `releventNews` |
| `PRACTICE_DB_NAME` | no | `Backspaces` |
| `CORS_ORIGINS` | no | `http://localhost:3000,https://backspaces-one.vercel.app` |

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
  unreachable → 503 with a message. Unknown/foreign revision ids → 404.
