/**
 * SM-2 spaced-repetition scheduler (the algorithm behind Anki/SuperMemo).
 *
 * quality: 0-5 — the frontend sends 1 (Again), 3 (Hard), 4 (Good), 5 (Easy).
 *  - quality < 3  → start over: review again tomorrow
 *  - quality >= 3 → interval grows 1d → 6d → previous × easeFactor
 * easeFactor never drops below 1.3.
 */
export function sm2(task, quality, now = new Date()) {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { repetitions = 0, intervalDays = 1, easeFactor = 2.5 } = task;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  return {
    repetitions,
    intervalDays,
    easeFactor: Math.round(easeFactor * 100) / 100,
    lastReviewedAt: now,
    nextReviewAt: new Date(now.getTime() + intervalDays * 86_400_000),
  };
}
