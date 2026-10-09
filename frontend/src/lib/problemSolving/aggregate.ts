// src/lib/problemSolving/aggregate.ts — the BFF core. Fetches every configured
// platform in parallel (one failing platform never breaks the others),
// caches the results, and merges them into one StatsResponse.
// SERVER ONLY.
import type {
  Activity,
  Contest,
  ContestsResponse,
  DifficultySplit,
  PlatformKey,
  PlatformState,
  PlatformStats,
  PotdResponse,
  StatsResponse,
  StreakInfo,
  TopicStat,
} from "./types";
import { fetchLeetCode, fetchLeetCodeContests, fetchLeetCodePotd } from "./leetcode";
import { fetchCodeforces, fetchCodeforcesContests } from "./codeforces";
import { fetchCodechef, fetchCodechefContests } from "./codechef";
import { fetchGfg, fetchGfgPotd } from "./gfg";
import { HANDLE_ENV, cached, dayKey, errorMessage, getHandle } from "./server-utils";

const PLATFORMS: PlatformKey[] = ["leetcode", "codeforces", "codechef", "gfg"];

const STATS_TTL = 30 * 60_000; // 30 min — the Sync button can force a refresh
const CONTESTS_TTL = 30 * 60_000;
const POTD_TTL = 60 * 60_000;

// ---------------------------------------------------------------- stats

async function loadPlatform(
  platform: PlatformKey,
  force: boolean
): Promise<{ state: PlatformState; topics?: TopicStat[] }> {
  const handle = getHandle(platform);
  if (!handle) return { state: { status: "missing", envKey: HANDLE_ENV[platform] } };

  try {
    if (platform === "leetcode") {
      const res = await cached(`lc:${handle}`, STATS_TTL, () => fetchLeetCode(handle), { force });
      return { state: { status: "ok", data: res.stats }, topics: res.topics };
    }
    const loader =
      platform === "codeforces" ? fetchCodeforces : platform === "codechef" ? fetchCodechef : fetchGfg;
    const data = await cached(`${platform}:${handle}`, STATS_TTL, () => loader(handle), { force });
    return { state: { status: "ok", data } };
  } catch (err) {
    return { state: { status: "error", handle, error: errorMessage(err) } };
  }
}

function computeStreak(stats: PlatformStats[]): StreakInfo {
  const days: Record<string, number> = {};
  for (const s of stats) for (const [d, n] of Object.entries(s.dayCounts)) days[d] = (days[d] ?? 0) + n;

  const active = new Set(Object.keys(days).filter((d) => days[d] > 0));
  const DAY = 86_400_000;
  // "today" and the previous days, as YYYY-MM-DD in STREAK_TIMEZONE
  const now = Date.now();
  const key = (offset: number) => dayKey(now - offset * DAY);

  const activeToday = active.has(key(0));
  let current = 0;
  for (let i = activeToday ? 0 : 1; active.has(key(i)); i++) current++;

  // longest run across all recorded days
  const sorted = [...active].sort();
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const t = Date.parse(`${d}T12:00:00Z`);
    run = prev !== null && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }

  const recentDays = Array.from({ length: 14 }, (_, i) => {
    const date = key(13 - i);
    return { date, count: days[date] ?? 0 };
  });

  return { current, longest: Math.max(longest, current), activeToday, totalActiveDays: active.size, recentDays };
}

export async function getStats(force = false): Promise<StatsResponse> {
  const results = await Promise.all(PLATFORMS.map((p) => loadPlatform(p, force)));

  const platforms = Object.fromEntries(PLATFORMS.map((p, i) => [p, results[i].state])) as Record<
    PlatformKey,
    PlatformState
  >;
  const ok = results
    .map((r) => r.state)
    .filter((s): s is Extract<PlatformState, { status: "ok" }> => s.status === "ok")
    .map((s) => s.data);

  const zero = () => Object.fromEntries(PLATFORMS.map((p) => [p, 0])) as Record<PlatformKey, number>;
  const byPlatform = zero();
  const contestsByPlatform = zero();
  const difficulty: DifficultySplit = { easy: 0, medium: 0, hard: 0 };
  for (const s of ok) {
    byPlatform[s.platform] = s.solved;
    contestsByPlatform[s.platform] = s.contests;
    if (s.difficulty) {
      difficulty.easy += s.difficulty.easy;
      difficulty.medium += s.difficulty.medium;
      difficulty.hard += s.difficulty.hard;
    }
  }

  const activity: Activity[] = ok
    .flatMap((s) => s.recent)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  const ratingHistory: StatsResponse["ratingHistory"] = {};
  for (const s of ok) if (s.ratingHistory.length) ratingHistory[s.platform] = s.ratingHistory;

  return {
    fetchedAt: new Date().toISOString(),
    platforms,
    totals: {
      solved: Object.values(byPlatform).reduce((a, b) => a + b, 0),
      contests: Object.values(contestsByPlatform).reduce((a, b) => a + b, 0),
      difficulty,
      byPlatform,
      contestsByPlatform,
    },
    streak: computeStreak(ok),
    topics: results.find((r) => r.topics)?.topics ?? [],
    ratingHistory,
    activity,
    displayName: ok.find((s) => s.displayName)?.displayName ?? null,
  };
}

// ---------------------------------------------------------------- contests

export async function getContests(force = false): Promise<ContestsResponse> {
  const sources: [PlatformKey, () => Promise<Contest[]>][] = [
    ["leetcode", fetchLeetCodeContests],
    ["codeforces", fetchCodeforcesContests],
    ["codechef", fetchCodechefContests],
  ];
  const settled = await Promise.allSettled(
    sources.map(([p, fn]) => cached(`contests:${p}`, CONTESTS_TTL, fn, { force }))
  );

  const errors: ContestsResponse["errors"] = {};
  const now = Date.now();
  const contests: Contest[] = [];
  settled.forEach((r, i) => {
    const platform = sources[i][0];
    if (r.status === "fulfilled") contests.push(...r.value);
    else errors[platform] = errorMessage(r.reason);
  });

  return {
    fetchedAt: new Date().toISOString(),
    // drop anything that already ended; keep live ones
    contests: contests
      .filter((c) => Number.isFinite(c.start) && c.start + c.durationSec * 1000 > now)
      .sort((a, b) => a.start - b.start),
    errors,
  };
}

// ---------------------------------------------------------------- POTD

export async function getPotd(force = false): Promise<PotdResponse> {
  // key by date so a new problem shows up right after midnight
  const today = dayKey(Date.now());
  const [lc, gfg] = await Promise.allSettled([
    cached(`potd:lc:${today}`, POTD_TTL, fetchLeetCodePotd, { force }),
    cached(`potd:gfg:${today}`, POTD_TTL, fetchGfgPotd, { force }),
  ]);
  const errors: PotdResponse["errors"] = {};
  const problems = [];
  if (lc.status === "fulfilled") problems.push(lc.value);
  else errors.leetcode = errorMessage(lc.reason);
  if (gfg.status === "fulfilled") problems.push(gfg.value);
  else errors.gfg = errorMessage(gfg.reason);
  return { fetchedAt: new Date().toISOString(), problems, errors };
}
