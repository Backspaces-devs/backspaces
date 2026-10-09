// src/lib/problemSolving/codechef.ts — CodeChef has no public user API, so we
// read the public profile page (rating, stars, solved count, rating history,
// daily submission heatmap) and the "recent activity" endpoint it uses.
import type { Activity, Contest, PlatformStats, RatingPoint } from "./types";
import { UpstreamError, addDayCount, fetchJson, fetchText, verdictFromLabel } from "./server-utils";

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

  const dayCounts: Record<string, number> = {};
  for (const d of extractJsArray<{ date: string; value: number }>(html, "userDailySubmissionsStats")) {
    if (d.date) addDayCount(dayCounts, padDate(d.date), Number(d.value) || 0);
  }

  return {
    platform: "codechef",
    handle,
    profileUrl: `${BASE}/users/${handle}`,
    solved,
    difficulty: null, // CodeChef doesn't expose a difficulty split
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
