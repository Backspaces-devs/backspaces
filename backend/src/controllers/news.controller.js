import { getNews, getNewsById, getNewsCount } from "../services/news.service.js";

const VALID_SORTS = ["date", "relevance", "impact"];

/** GET /api/news?limit=50&sort=date&category=AI%20%26%20ML&q=python */
export async function listNews(req, res) {
  const limit = parseInt(req.query.limit, 10) || 50;
  const sort = VALID_SORTS.includes(req.query.sort) ? req.query.sort : "date";
  const category =
    typeof req.query.category === "string" && req.query.category.trim()
      ? req.query.category.trim()
      : undefined;
  const q =
    typeof req.query.q === "string" && req.query.q.trim() ? req.query.q.trim() : undefined;

  const articles = await getNews({ limit, sort, category, q });
  res.json(articles);
}

/** GET /api/news/:id */
export async function getNewsItem(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id — must be a positive number" });
    return;
  }

  const article = await getNewsById(id);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json(article);
}

/** GET /health — liveness + MongoDB check + stored article count. */
export async function health(_req, res) {
  try {
    const articles = await getNewsCount();
    res.json({ status: "ok", mongo: "connected", articles, time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "error", mongo: "disconnected", message: err.message });
  }
}
