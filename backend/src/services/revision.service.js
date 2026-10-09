import { ObjectId } from "mongodb";
import { getPracticeCollection } from "../config/db.js";
import { sm2 } from "../utils/sm2.js";

const DAY = 86_400_000;
const PLATFORMS = ["leetcode", "codeforces", "codechef", "gfg", "other"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const tasks = () => getPracticeCollection("revisionTasks");

let indexed = false;
async function ensureIndexes() {
  if (indexed) return;
  await tasks().createIndex({ user: 1, platform: 1, slug: 1 }, { unique: true });
  await tasks().createIndex({ user: 1, nextReviewAt: 1 });
  indexed = true;
}

/** Every task for a user, soonest due first. */
export async function listTasks(user) {
  await ensureIndexes();
  return tasks().find({ user }).sort({ nextReviewAt: 1 }).limit(500).toArray();
}

/**
 * Add a problem to the queue. Idempotent per (user, platform, slug) — adding
 * the same problem twice returns the existing task.
 * If `solvedAt` is given, the first review is scheduled 1 day after that solve.
 */
export async function addTask(user, input) {
  await ensureIndexes();
  const now = new Date();
  const solvedAt =
    Number.isFinite(Number(input.solvedAt)) && Number(input.solvedAt) > 0 && Number(input.solvedAt) <= now.getTime()
      ? new Date(Number(input.solvedAt))
      : now;

  const doc = {
    user,
    title: String(input.title).slice(0, 200),
    platform: PLATFORMS.includes(input.platform) ? input.platform : "other",
    slug: String(input.slug).slice(0, 200),
    url: typeof input.url === "string" && /^https?:\/\//.test(input.url) ? input.url.slice(0, 500) : "",
    difficulty: DIFFICULTIES.includes(input.difficulty) ? input.difficulty : null,
    topics: Array.isArray(input.topics) ? input.topics.filter((t) => typeof t === "string").slice(0, 5) : [],
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    lastReviewedAt: solvedAt,
    nextReviewAt: new Date(solvedAt.getTime() + DAY),
    createdAt: now,
  };

  await tasks().updateOne(
    { user, platform: doc.platform, slug: doc.slug },
    { $setOnInsert: doc },
    { upsert: true }
  );
  return tasks().findOne({ user, platform: doc.platform, slug: doc.slug });
}

/** Record a review and reschedule with SM-2. Returns null if not found. */
export async function reviewTask(user, id, quality) {
  const _id = new ObjectId(id);
  const task = await tasks().findOne({ _id, user });
  if (!task) return null;
  const update = sm2(task, quality);
  await tasks().updateOne({ _id, user }, { $set: update, $inc: { reviews: 1 } });
  return { ...task, ...update, reviews: (task.reviews || 0) + 1 };
}

/** Remove a task. Returns true if something was deleted. */
export async function deleteTask(user, id) {
  const res = await tasks().deleteOne({ _id: new ObjectId(id), user });
  return res.deletedCount > 0;
}
