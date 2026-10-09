import { getPracticeCollection } from "../config/db.js";

const progress = () => getPracticeCollection("sheetProgress");

let indexed = false;
async function ensureIndexes() {
  if (indexed) return;
  await progress().createIndex({ user: 1, sheetId: 1 }, { unique: true });
  indexed = true;
}

/** { [sheetId]: completedProblemIds[] } for one user. */
export async function getProgress(user) {
  await ensureIndexes();
  const docs = await progress().find({ user }).toArray();
  return Object.fromEntries(docs.map((d) => [d.sheetId, d.completed || []]));
}

/** Mark problems done / not done in one sheet, then return the full progress map. */
export async function setProgress(user, sheetId, problemIds, done) {
  await ensureIndexes();
  const ids = problemIds.filter((id) => typeof id === "string" && id.length <= 200).slice(0, 500);
  if (ids.length) {
    await progress().updateOne(
      { user, sheetId },
      {
        ...(done ? { $addToSet: { completed: { $each: ids } } } : { $pull: { completed: { $in: ids } } }),
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
  }
  return getProgress(user);
}
