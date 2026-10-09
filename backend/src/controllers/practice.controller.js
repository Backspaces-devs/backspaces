import { listTasks, addTask, reviewTask, deleteTask } from "../services/revision.service.js";
import { getProgress, setProgress } from "../services/sheets.service.js";

/**
 * Every practice route is scoped by `user` (query string or JSON body).
 * The Next.js proxy fills it in from the platform handles in the frontend's
 * .env, so the browser never chooses it.
 */
function getUser(req) {
  const raw = req.body?.user ?? req.query.user;
  if (typeof raw !== "string") return null;
  const user = raw.trim();
  return /^[\w.-]{1,64}$/.test(user) ? user : null;
}

function requireUser(req, res) {
  const user = getUser(req);
  if (!user) res.status(400).json({ error: "Missing or invalid `user`" });
  return user;
}

const isObjectId = (id) => /^[a-f0-9]{24}$/i.test(id);

/** GET /api/revision?user=… */
export async function listRevision(req, res) {
  const user = requireUser(req, res);
  if (!user) return;
  res.json(await listTasks(user));
}

/** POST /api/revision  { user, title, slug, platform, url, difficulty?, topics?, solvedAt? } */
export async function createRevision(req, res) {
  const user = requireUser(req, res);
  if (!user) return;
  const { title, slug } = req.body ?? {};
  if (typeof title !== "string" || !title.trim() || typeof slug !== "string" || !slug.trim()) {
    res.status(400).json({ error: "title and slug are required" });
    return;
  }
  res.json(await addTask(user, req.body));
}

/** POST /api/revision/:id/review  { user, quality: 0-5 } */
export async function reviewRevision(req, res) {
  const user = requireUser(req, res);
  if (!user) return;
  if (!isObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const quality = Number(req.body?.quality);
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    res.status(400).json({ error: "quality must be an integer from 0 to 5" });
    return;
  }
  const task = await reviewTask(user, req.params.id, quality);
  if (!task) {
    res.status(404).json({ error: "Revision task not found" });
    return;
  }
  res.json(task);
}

/** DELETE /api/revision/:id?user=… */
export async function removeRevision(req, res) {
  const user = requireUser(req, res);
  if (!user) return;
  if (!isObjectId(req.params.id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = await deleteTask(user, req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Revision task not found" });
    return;
  }
  res.json({ ok: true });
}

/** GET /api/sheets/progress?user=… */
export async function getSheetProgress(req, res) {
  const user = requireUser(req, res);
  if (!user) return;
  res.json(await getProgress(user));
}

/** PUT /api/sheets/progress  { user, sheetId, problemIds: string[], done: boolean } */
export async function updateSheetProgress(req, res) {
  const user = requireUser(req, res);
  if (!user) return;
  const { sheetId, problemIds, done } = req.body ?? {};
  if (typeof sheetId !== "string" || !/^[\w-]{1,64}$/.test(sheetId) || !Array.isArray(problemIds) || typeof done !== "boolean") {
    res.status(400).json({ error: "sheetId, problemIds[] and done are required" });
    return;
  }
  res.json(await setProgress(user, sheetId, problemIds, done));
}
