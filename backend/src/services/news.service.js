import { getCollection } from "../config/db.js";

/**
 * The news engine stores `date` as a display string ("Sep 18, 2026"), so
 * date sorting happens here, in the app. The collection is small (the
 * engine writes at most ~50 docs per run), so this is cheap and reliable.
 *
 * Optional upgrade later: have the engine also store a `published_at`
 * ISO timestamp, then move this sort into Mongo itself.
 */
function parseArticleDate(dateStr) {
  if (!dateStr) return new Date(0);
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SCORE_FIELDS = {
  relevance: "relevance_score",
  impact: "impact_score",
};

/**
 * Fetch news from MongoDB.
 * @param {object} opts
 * @param {number} opts.limit      max results (capped at 100)
 * @param {string} [opts.category] exact category filter
 * @param {string} opts.sort       "date" (default, latest first) | "relevance" | "impact"
 * @param {string} [opts.q]        case-insensitive search in heading + description
 * @returns {Promise<Array>} article documents
 */
export async function getNews({ limit = 50, category, sort = "date", q } = {}) {
  const filter = {};
  if (category) filter.category = category;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ heading: rx }, { description: rx }];
  }

  const docs = await getCollection().find(filter).toArray();

  if (sort in SCORE_FIELDS) {
    const field = SCORE_FIELDS[sort];
    docs.sort((a, b) => (b[field] || 0) - (a[field] || 0));
  } else {
    // Default: latest first; ties broken by relevance.
    docs.sort((a, b) => {
      const byDate = parseArticleDate(b.date) - parseArticleDate(a.date);
      return byDate !== 0 ? byDate : (b.relevance_score || 0) - (a.relevance_score || 0);
    });
  }

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return docs.slice(0, safeLimit);
}

/** Fetch one article by its numeric id (the engine sets _id = id). */
export async function getNewsById(id) {
  return getCollection().findOne({ _id: id });
}

/** Total articles currently stored — used by /health. */
export async function getNewsCount() {
  return getCollection().countDocuments();
}
