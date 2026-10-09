// src/lib/problemSolving/codeforces.ts — Codeforces official REST API.
// Codeforces limits each IP to roughly 1 call per 2 seconds, so calls run one
// after another and retry once on "Call limit exceeded".
import type { Activity, Contest, DifficultySplit, PlatformStats, RatingPoint } from "./types";
import { UpstreamError, addDayCount, cfRatingToDifficulty, dayKey, fetchJson, sleep } from "./server-utils";

interface CfResponse<T> {
  status: "OK" | "FAILED";
  comment?: string;
  result?: T;
}

async function cf<T>(method: string, params: Record<string, string | number>): Promise<T> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `https://codeforces.com/api/${method}?${qs}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetchJson<CfResponse<T>>(url, { timeoutMs: 20_000 });
    if (res?.status === "OK" && res.result !== undefined) return res.result;
    const comment = res?.comment ?? "Codeforces API error";
    if (attempt === 0 && /limit exceeded/i.test(comment)) {
      await sleep(2100);
      continue;
    }
    throw new UpstreamError(comment.replace(/^handles?: /i, ""));
  }
  throw new UpstreamError("Codeforces API error");
}

interface CfRatingChange {
  contestId: number;
  contestName: string;
  ratingUpdateTimeSeconds: number;
  newRating: number;
}

interface CfSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  problem: { contestId?: number; problemsetName?: string; index: string; name: string; rating?: number; tags: string[] };
  programmingLanguage: string;
  verdict?: string;
}

const VERDICT_LABEL: Record<string, string> = {
  OK: "Accepted",
  WRONG_ANSWER: "Wrong Answer",
  TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
  MEMORY_LIMIT_EXCEEDED: "Memory Limit Exceeded",
  RUNTIME_ERROR: "Runtime Error",
  COMPILATION_ERROR: "Compilation Error",
  TESTING: "Testing…",
};

function verdictKind(v?: string): Activity["verdict"] {
  switch (v) {
    case "OK":
      return "ac";
    case "WRONG_ANSWER":
      return "wa";
    case "TIME_LIMIT_EXCEEDED":
    case "IDLENESS_LIMIT_EXCEEDED":
      return "tle";
    case "MEMORY_LIMIT_EXCEEDED":
      return "mle";
    case "RUNTIME_ERROR":
      return "re";
    case "COMPILATION_ERROR":
      return "ce";
    default:
      return "other";
  }
}

/** Official Codeforces rank names by rating. */
export function cfRankTitle(rating: number | null): string | null {
  if (rating == null) return null;
  if (rating < 1200) return "Newbie";
  if (rating < 1400) return "Pupil";
  if (rating < 1600) return "Specialist";
  if (rating < 1900) return "Expert";
  if (rating < 2100) return "Candidate Master";
  if (rating < 2300) return "Master";
  if (rating < 2400) return "International Master";
  if (rating < 2600) return "Grandmaster";
  if (rating < 3000) return "International Grandmaster";
  return "Legendary Grandmaster";
}

function problemUrl(p: CfSubmission["problem"]) {
  if (!p.contestId) return "https://codeforces.com/problemset";
  return p.contestId >= 100000
    ? `https://codeforces.com/gym/${p.contestId}/problem/${p.index}`
    : `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
}

export async function fetchCodeforces(handle: string): Promise<PlatformStats> {
  const ratings = await cf<CfRatingChange[]>("user.rating", { handle });
  const submissions = await cf<CfSubmission[]>("user.status", { handle, from: 1, count: 10000 });

  const history: RatingPoint[] = ratings.map((r) => ({
    t: r.ratingUpdateTimeSeconds * 1000,
    rating: r.newRating,
    contest: r.contestName,
  }));
  const rating = history.length ? history[history.length - 1].rating : null;
  const maxRating = history.length ? Math.max(...history.map((h) => h.rating)) : null;

  const dayCounts: Record<string, number> = {};
  const solved = new Map<string, CfSubmission["problem"]>();
  for (const s of submissions) {
    addDayCount(dayCounts, dayKey(s.creationTimeSeconds * 1000));
    if (s.verdict === "OK") {
      const key = `${s.problem.contestId ?? s.problem.problemsetName}-${s.problem.index}`;
      if (!solved.has(key)) solved.set(key, s.problem);
    }
  }

  const difficulty: DifficultySplit = { easy: 0, medium: 0, hard: 0 };
  for (const p of solved.values()) {
    const d = cfRatingToDifficulty(p.rating);
    if (d === "Easy") difficulty.easy++;
    else if (d === "Medium") difficulty.medium++;
    else if (d === "Hard") difficulty.hard++;
  }

  const recent: Activity[] = submissions
    .filter((s) => s.verdict !== "TESTING")
    .slice(0, 15)
    .map((s) => ({
      id: `codeforces-${s.id}`,
      platform: "codeforces",
      title: `${s.problem.contestId ?? ""}${s.problem.index} · ${s.problem.name}`,
      url: problemUrl(s.problem),
      slug: `${s.problem.contestId ?? ""}${s.problem.index}`,
      status: VERDICT_LABEL[s.verdict ?? ""] ?? (s.verdict ?? "Unknown").replace(/_/g, " ").toLowerCase(),
      verdict: verdictKind(s.verdict),
      difficulty: cfRatingToDifficulty(s.problem.rating),
      rating: s.problem.rating ?? null,
      lang: s.programmingLanguage,
      timestamp: s.creationTimeSeconds * 1000,
    }));

  return {
    platform: "codeforces",
    handle,
    profileUrl: `https://codeforces.com/profile/${handle}`,
    solved: solved.size,
    difficulty,
    rating,
    maxRating,
    title: cfRankTitle(rating),
    globalRank: null,
    contests: ratings.length,
    ratingHistory: history,
    dayCounts,
    recent,
  };
}

export async function fetchCodeforcesContests(): Promise<Contest[]> {
  const list = await cf<{ id: number; name: string; phase: string; startTimeSeconds?: number; durationSeconds: number }[]>(
    "contest.list",
    { gym: "false" }
  );
  return list
    .filter((c) => (c.phase === "BEFORE" || c.phase === "CODING") && c.startTimeSeconds)
    .map((c) => ({
      id: `codeforces-${c.id}`,
      platform: "codeforces" as const,
      title: c.name,
      url: `https://codeforces.com/contests/${c.id}`,
      start: (c.startTimeSeconds as number) * 1000,
      durationSec: c.durationSeconds,
    }));
}
