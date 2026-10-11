// src/lib/problemSolving/codechef.ts — CodeChef has no public user API, so we
// read the public profile page (rating, stars, solved count, rating history,
// daily submission heatmap, solved problem names) and the "recent activity"
// endpoint it uses. Difficulty is looked up per problem — see classifyCodechef().
import type { Activity, Contest, Difficulty, DifficultySplit, PlatformStats, RatingPoint } from "./types";
import {
  UpstreamError,
  addDayCount,
  ccCategoryToDifficulty,
  ccRatingToDifficulty,
  fetchJson,
  fetchText,
  verdictFromLabel,
} from "./server-utils";

const BASE = "https://www.codechef.com";

function num(text: string | undefined | null): number | null {
  if (!text) return null;
  const n = parseInt(text.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

/** Pulls a `var name = [...];` JSON array out of the profile page. */
function extractJsArray<T>(html: string, name: string): T[] {
  const m = html.match(new RegExp(`${name}\\s*=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!m) return [];
  try {
    return JSON.parse(m[1]) as T[];
  } catch {
    return [];
  }
}

/** "2026-6-17" → "2026-06-17" */
function padDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** CodeChef shows times as "09:46 PM 05/10/26" (IST) or "2 hours ago". */
function parseCodechefTime(text: string, now = Date.now()): number | null {
  const rel = text.match(/(\d+)\s*(sec|min|hour|day)/i);
  if (rel && /ago/i.test(text)) {
    const n = Number(rel[1]);
    const unit = rel[2].toLowerCase();
    const ms = unit === "sec" ? 1e3 : unit === "min" ? 6e4 : unit === "hour" ? 36e5 : 864e5;
    return now - n * ms;
  }
  const abs = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s+(\d{2})\/(\d{2})\/(\d{2})/i);
  if (!abs) return null;
  let hour = Number(abs[1]) % 12;
  if (abs[3].toUpperCase() === "PM") hour += 12;
  const iso = `20${abs[6]}-${abs[5]}-${abs[4]}T${String(hour).padStart(2, "0")}:${abs[2]}:00+05:30`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

async function fetchRecent(handle: string): Promise<Activity[]> {
  try {
    const res = await fetchJson<{ content?: string }>(
      `${BASE}/recent/user?page=0&user_handle=${encodeURIComponent(handle)}`,
      { timeoutMs: 10_000 }
    );
    const html = res?.content ?? "";
    const rows = [...html.matchAll(/<tr\s*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]).filter((r) => r.includes("<td"));
    const out: Activity[] = [];
    for (const [i, row] of rows.slice(0, 15).entries()) {
      const cells = [...row.matchAll(/<td[^>]*title='([^']*)'/g)].map((m) => m[1]);
      const link = row.match(/href='([^']*\/problems\/[^']*)'[^>]*>([^<]*)<\/a>/);
      const result = row.match(/<span title='([^']*)'/)?.[1] ?? "";
      const ts = parseCodechefTime(cells[0] ?? "");
      if (!link || !ts) continue;
      // submission times only have minute precision, so several attempts at the
      // same problem can share a timestamp — the solution id is what's unique
      const solutionId = row.match(/\/viewsolution\/(\d+)/)?.[1];
      const label = result ? result.replace(/\b\w/g, (c) => c.toUpperCase()) : "Submitted";
      out.push({
        id: `codechef-${solutionId ?? `${ts}-${link[2].trim()}-${i}`}`,
        platform: "codechef",
        title: link[2].trim(),
        slug: link[2].trim(),
        url: `${BASE}${link[1]}`,
        status: label,
        verdict: verdictFromLabel(result),
        difficulty: null,
        lang: cells[3] ?? null,
        timestamp: ts,
      });
    }
    return out;
  } catch {
    return []; // recent activity is optional
  }
}

export async function fetchCodechef(handle: string): Promise<PlatformStats> {
  const [html, recent] = await Promise.all([
    fetchText(`${BASE}/users/${encodeURIComponent(handle)}`, { timeoutMs: 15_000 }).catch((err) => {
      if (err instanceof UpstreamError && err.status === 404) throw new UpstreamError(`CodeChef user "${handle}" not found`);
      throw err;
    }),
    fetchRecent(handle),
  ]);

  if (!html.includes("rating-number")) {
    throw new UpstreamError(`CodeChef user "${handle}" not found`);
  }

  const rating = num(html.match(/<div class="rating-number">\s*(\d+)/)?.[1]);
  const maxRating = num(html.match(/Highest Rating\s*(\d+)/)?.[1]);
  const starBlock = html.match(/<div class="rating-star">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const stars = (starBlock.match(/&#9733;|★/g) ?? []).length;
  const globalRank = num(html.match(/<strong class='global-rank'>(\d+)<\/strong>/)?.[1]);
  const solved = num(html.match(/Total Problems Solved:\s*(\d+)/)?.[1]) ?? 0;

  const allRating = extractJsArray<{ name: string; rating: string; end_date: string }>(html, "var all_rating");
  const history: RatingPoint[] = allRating
    .map((r) => ({
      t: Date.parse(r.end_date.replace(" ", "T") + "+05:30"),
      rating: Number(r.rating),
      contest: r.name,
    }))
    .filter((r) => Number.isFinite(r.t) && Number.isFinite(r.rating));

  const contests =
    num(html.match(/No\. of Contests Participated:\s*<b>(\d+)/)?.[1]) ??
    num(html.match(/Contests \((\d+)\)/)?.[1]) ??
    history.length;

  // "Problems Solved" section: names grouped by contest / practice path (no codes)
  const solvedSection = html.match(/class="rating-data-section problems-solved">([\s\S]*?)<\/section>/)?.[1] ?? "";
  const solvedNames = [
    ...new Set(
      [...solvedSection.matchAll(/<span style="font-size: 12px";?>([^<]+)<\/span>/g)]
        .map((m) => decodeEntities(m[1]).trim())
        .filter(Boolean)
    ),
  ];

  const dayCounts: Record<string, number> = {};
  for (const d of extractJsArray<{ date: string; value: number }>(html, "userDailySubmissionsStats")) {
    if (d.date) addDayCount(dayCounts, padDate(d.date), Number(d.value) || 0);
  }

  return {
    platform: "codechef",
    handle,
    profileUrl: `${BASE}/users/${handle}`,
    solved,
    difficulty: null, // filled in by classifyCodechef() — see aggregate.ts
    solvedNames,
    rating,
    maxRating: maxRating ?? (history.length ? Math.max(...history.map((h) => h.rating)) : null),
    title: stars ? `${stars}★` : null,
    globalRank: globalRank || null,
    contests,
    ratingHistory: history,
    dayCounts,
    recent,
  };
}

export async function fetchCodechefContests(): Promise<Contest[]> {
  const res = await fetchJson<{
    status: string;
    present_contests?: CcContest[];
    future_contests?: CcContest[];
  }>(`${BASE}/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all`);
  if (res?.status !== "success") throw new UpstreamError("CodeChef contest list unavailable");
  return [...(res.present_contests ?? []), ...(res.future_contests ?? [])].map((c) => ({
    id: `codechef-${c.contest_code}`,
    platform: "codechef" as const,
    title: c.contest_name,
    url: `${BASE}/${c.contest_code}`,
    start: Date.parse(c.contest_start_date_iso),
    durationSec: Number(c.contest_duration) * 60,
  }));
}

interface CcContest {
  contest_code: string;
  contest_name: string;
  contest_start_date_iso: string;
  contest_duration: string;
}

// ---------------------------------------------------------------- difficulty
// CodeChef's profile only lists solved problem *names*. For each one we look up
// the problem (search → code + difficulty rating; unrated problems fall back to
// the practice category) and cache the answer for a week. CodeChef throttles
// bursts, so lookups run at most 3 at a time; each stats request waits up to
// `budgetMs` and anything unfinished is reported as `pending` while the lookups
// carry on in the background, so the next request picks them up.

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

const LEVEL_TTL = 7 * 24 * 60 * 60_000;
const MAX_CONCURRENT = 3;
const levelCache = new Map<string, { difficulty: Difficulty | null; at: number }>();
const inflight = new Map<string, Promise<void>>();

let active = 0;
const waiting: (() => void)[] = [];
async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await task();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

interface CcSearchResult {
  data?: { code: string; name: string; difficulty_rating: string; contest_code: string | null }[];
}

async function lookupDifficulty(name: string): Promise<Difficulty | null> {
  const search = await limited(() =>
    fetchJson<CcSearchResult>(`${BASE}/api/list/problems?limit=10&search=${encodeURIComponent(name)}`, {
      timeoutMs: 10_000,
    })
  );
  const wanted = name.toLowerCase();
  const matches = (search.data ?? []).filter((p) => p.name.trim().toLowerCase() === wanted);
  if (matches.length === 0) return null;

  const rated = matches.find((p) => Number(p.difficulty_rating) > 0);
  if (rated) return ccRatingToDifficulty(Number(rated.difficulty_rating));

  // unrated (DSA / practice problems): use CodeChef's practice category instead
  const problem = await limited(() =>
    fetchJson<{ difficulty_rating?: string; category_name?: string }>(
      `${BASE}/api/contests/PRACTICE/problems/${encodeURIComponent(matches[0].code)}`,
      { timeoutMs: 10_000 }
    )
  );
  return ccRatingToDifficulty(Number(problem.difficulty_rating)) ?? ccCategoryToDifficulty(problem.category_name);
}

function ensureLookup(name: string): Promise<void> | null {
  const key = name.toLowerCase();
  const hit = levelCache.get(key);
  if (hit && Date.now() - hit.at < LEVEL_TTL) return null;
  let job = inflight.get(key);
  if (!job) {
    job = lookupDifficulty(name)
      .then((difficulty) => {
        levelCache.set(key, { difficulty, at: Date.now() });
      })
      .catch(() => {
        // network / throttling error: not cached, so the next request retries
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, job);
  }
  return job;
}

/** Easy/Medium/Hard split of a CodeChef user's solved problems. */
export async function classifyCodechef(names: string[], totalSolved: number, budgetMs = 5_000): Promise<DifficultySplit> {
  const jobs = names.map(ensureLookup).filter((j): j is Promise<void> => j !== null);
  if (jobs.length) {
    await Promise.race([Promise.allSettled(jobs), new Promise((resolve) => setTimeout(resolve, budgetMs))]);
  }

  const split: DifficultySplit = { easy: 0, medium: 0, hard: 0, unrated: 0, pending: 0 };
  for (const name of names) {
    const key = name.toLowerCase();
    const hit = levelCache.get(key);
    if (!hit) {
      if (inflight.has(key)) split.pending!++;
      else split.unrated!++; // lookup failed this time — retried on the next request
      continue;
    }
    if (hit.difficulty === "Easy") split.easy++;
    else if (hit.difficulty === "Medium") split.medium++;
    else if (hit.difficulty === "Hard") split.hard++;
    else split.unrated!++;
  }
  // the profile's total can include problems it doesn't list by name
  split.unrated! += Math.max(0, totalSolved - names.length);
  return split;
}
