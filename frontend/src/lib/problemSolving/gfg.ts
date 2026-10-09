// src/lib/problemSolving/gfg.ts — GeeksforGeeks.
// Solved problems (with difficulty + solve time) come from GFG's own practice
// API; contest count / rating come from Tashif's GFG Stats API (optional).
import type { Activity, Difficulty, DifficultySplit, PlatformStats, Potd } from "./types";
import { UpstreamError, addDayCount, fetchJson, normaliseDifficulty } from "./server-utils";

interface GfgSubmissions {
  status: string;
  message?: string;
  count?: number;
  result?: Record<string, Record<string, { slug: string; pname: string; lang: string; user_subtime: string }>>;
}

interface TashifGfg {
  data?: { totalContests?: number | null; currentRating?: number | null; maxRating?: number | null; rank?: number | null };
}

export async function fetchGfg(handle: string): Promise<PlatformStats> {
  const [subs, extra] = await Promise.all([
    fetchJson<GfgSubmissions>("https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, requestType: "", year: "", month: "" }),
    }),
    fetchJson<TashifGfg>(`https://gfg-stats.tashif.codes/${encodeURIComponent(handle)}`, { timeoutMs: 10_000 }).catch(
      () => null
    ),
  ]);

  if (subs?.status !== "success" || !subs.result) {
    throw new UpstreamError(`GFG user "${handle}" not found`);
  }

  const difficulty: DifficultySplit = { easy: 0, medium: 0, hard: 0 };
  const dayCounts: Record<string, number> = {};
  const solvedSlugs: string[] = [];
  const all: Activity[] = [];

  for (const [level, problems] of Object.entries(subs.result)) {
    const diff = normaliseDifficulty(level);
    for (const p of Object.values(problems)) {
      if (diff === "Easy") difficulty.easy++;
      else if (diff === "Medium") difficulty.medium++;
      else if (diff === "Hard") difficulty.hard++;
      solvedSlugs.push(p.slug);
      // GFG timestamps are IST wall-clock: "2022-09-28 21:49:47"
      const ts = Date.parse(p.user_subtime.replace(" ", "T") + "+05:30");
      if (Number.isFinite(ts)) {
        addDayCount(dayCounts, p.user_subtime.slice(0, 10));
        all.push({
          id: `gfg-${p.slug}`,
          platform: "gfg",
          title: p.pname,
          slug: p.slug,
          url: `https://www.geeksforgeeks.org/problems/${p.slug}/1`,
          status: "Accepted",
          verdict: "ac",
          difficulty: diff as Difficulty | null,
          lang: p.lang,
          timestamp: ts,
        });
      }
    }
  }

  all.sort((a, b) => b.timestamp - a.timestamp);
  const d = extra?.data;

  return {
    platform: "gfg",
    handle,
    profileUrl: `https://www.geeksforgeeks.org/user/${handle}/`,
    solved: subs.count ?? solvedSlugs.length,
    difficulty,
    rating: d?.currentRating ?? null,
    maxRating: d?.maxRating ?? null,
    title: null,
    globalRank: d?.rank ?? null,
    contests: d?.totalContests ?? 0,
    ratingHistory: [],
    dayCounts,
    recent: all.slice(0, 10),
    solvedSlugs,
  };
}

export async function fetchGfgPotd(): Promise<Potd> {
  const p = await fetchJson<{
    problem_name?: string;
    problem_url?: string;
    difficulty?: string;
    date?: string;
    accuracy?: number;
    tags?: { topic_tags?: string[] };
  }>("https://practiceapi.geeksforgeeks.org/api/vr/problems-of-day/problem/today/");
  if (!p?.problem_name || !p.problem_url) throw new UpstreamError("No GFG problem of the day");
  const slug = p.problem_url.match(/problems\/([^/]+)/)?.[1] ?? p.problem_name;
  return {
    platform: "gfg",
    title: p.problem_name,
    slug,
    url: p.problem_url,
    difficulty: normaliseDifficulty(p.difficulty),
    tags: p.tags?.topic_tags ?? [],
    acRate: p.accuracy != null ? Math.round(p.accuracy * 10) / 10 : null,
    date: (p.date ?? "").slice(0, 10),
  };
}
