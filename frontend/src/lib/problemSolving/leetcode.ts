// src/lib/problemSolving/leetcode.ts — LeetCode via its public GraphQL API.
// One query for profile/calendar/tags/contests/submissions, plus one small
// query to look up the difficulty of recently submitted problems.
import type { Activity, Difficulty, Potd, PlatformStats, RatingPoint, TopicStat } from "./types";
import { UpstreamError, addDayCount, dayKey, fetchJson, verdictFromLabel } from "./server-utils";

const ENDPOINT = "https://leetcode.com/graphql";

interface GqlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetchJson<GqlResponse<T>>(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res?.data) throw new UpstreamError(res?.errors?.[0]?.message ?? "LeetCode returned no data");
  return res.data;
}

const PROFILE_QUERY = `
query backspacesProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { realName ranking }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    userCalendar { streak totalActiveDays submissionCalendar }
    tagProblemCounts {
      fundamental { tagName tagSlug problemsSolved }
      intermediate { tagName tagSlug problemsSolved }
      advanced { tagName tagSlug problemsSolved }
    }
  }
  userContestRanking(username: $username) {
    attendedContestsCount rating globalRanking topPercentage badge { name }
  }
  userContestRankingHistory(username: $username) {
    attended rating contest { title startTime }
  }
  recentSubmissionList(username: $username, limit: 15) {
    id title titleSlug timestamp statusDisplay lang
  }
  recentAcSubmissionList(username: $username, limit: 20) {
    titleSlug
  }
}`;

interface ProfileData {
  matchedUser: {
    username: string;
    profile: { realName: string | null; ranking: number | null } | null;
    submitStatsGlobal: { acSubmissionNum: { difficulty: string; count: number }[] };
    userCalendar: { streak: number; totalActiveDays: number; submissionCalendar: string } | null;
    tagProblemCounts: Record<
      "fundamental" | "intermediate" | "advanced",
      { tagName: string; tagSlug: string; problemsSolved: number }[]
    > | null;
  } | null;
  userContestRanking: {
    attendedContestsCount: number;
    rating: number;
    globalRanking: number;
    topPercentage: number | null;
    badge: { name: string } | null;
  } | null;
  userContestRankingHistory: { attended: boolean; rating: number; contest: { title: string; startTime: number } }[] | null;
  recentSubmissionList: { id?: string; title: string; titleSlug: string; timestamp: string; statusDisplay: string; lang: string }[] | null;
  recentAcSubmissionList: { titleSlug: string }[] | null;
}

/** Looks up difficulty for a handful of slugs in ONE request (GraphQL aliases). */
async function difficultiesFor(slugs: string[]): Promise<Record<string, Difficulty>> {
  const unique = [...new Set(slugs)].filter((s) => /^[a-z0-9-]+$/.test(s)).slice(0, 25);
  if (unique.length === 0) return {};
  const query = `query { ${unique
    .map((s, i) => `q${i}: question(titleSlug: "${s}") { titleSlug difficulty }`)
    .join(" ")} }`;
  try {
    const data = await gql<Record<string, { titleSlug: string; difficulty: Difficulty } | null>>(query);
    const out: Record<string, Difficulty> = {};
    for (const q of Object.values(data)) if (q) out[q.titleSlug] = q.difficulty;
    return out;
  } catch {
    return {}; // difficulty is a nice-to-have — never fail the whole profile for it
  }
}

export interface LeetCodeResult {
  stats: PlatformStats;
  topics: TopicStat[];
}

export async function fetchLeetCode(handle: string): Promise<LeetCodeResult> {
  const data = await gql<ProfileData>(PROFILE_QUERY, { username: handle });
  const user = data.matchedUser;
  if (!user) throw new UpstreamError(`LeetCode user "${handle}" not found`);

  const ac = Object.fromEntries(user.submitStatsGlobal.acSubmissionNum.map((x) => [x.difficulty, x.count]));

  // calendar: keys are UTC-midnight epoch seconds
  const dayCounts: Record<string, number> = {};
  try {
    const cal = JSON.parse(user.userCalendar?.submissionCalendar ?? "{}") as Record<string, number>;
    for (const [sec, count] of Object.entries(cal)) addDayCount(dayCounts, dayKey(Number(sec) * 1000 + 6 * 3600_000), count);
  } catch {
    /* ignore malformed calendar */
  }

  const history: RatingPoint[] = (data.userContestRankingHistory ?? [])
    .filter((h) => h.attended)
    .map((h) => ({ t: h.contest.startTime * 1000, rating: Math.round(h.rating), contest: h.contest.title }));

  const subs = data.recentSubmissionList ?? [];
  const diffs = await difficultiesFor(subs.map((s) => s.titleSlug));
  const recent: Activity[] = subs.map((s) => ({
    id: `leetcode-${s.id ?? `${s.timestamp}-${s.titleSlug}`}`,
    platform: "leetcode",
    title: s.title,
    slug: s.titleSlug,
    url: `https://leetcode.com/problems/${s.titleSlug}/`,
    status: s.statusDisplay,
    verdict: verdictFromLabel(s.statusDisplay),
    difficulty: diffs[s.titleSlug] ?? null,
    lang: s.lang,
    timestamp: Number(s.timestamp) * 1000,
  }));

  const tags = user.tagProblemCounts;
  const topicMap = new Map<string, TopicStat>();
  if (tags) {
    for (const group of [tags.fundamental, tags.intermediate, tags.advanced]) {
      for (const t of group ?? []) {
        const prev = topicMap.get(t.tagSlug);
        topicMap.set(t.tagSlug, { name: t.tagName, slug: t.tagSlug, solved: (prev?.solved ?? 0) + t.problemsSolved });
      }
    }
  }
  const topics = [...topicMap.values()].filter((t) => t.solved > 0).sort((a, b) => b.solved - a.solved);

  const contest = data.userContestRanking;
  const title = contest?.badge?.name ?? (contest?.topPercentage != null ? `Top ${contest.topPercentage}%` : null);

  return {
    topics,
    stats: {
      platform: "leetcode",
      handle: user.username,
      profileUrl: `https://leetcode.com/u/${user.username}/`,
      displayName: user.profile?.realName || null,
      solved: ac.All ?? 0,
      difficulty: { easy: ac.Easy ?? 0, medium: ac.Medium ?? 0, hard: ac.Hard ?? 0 },
      rating: contest ? Math.round(contest.rating) : null,
      maxRating: history.length ? Math.max(...history.map((h) => h.rating)) : null,
      title,
      globalRank: contest?.globalRanking ?? user.profile?.ranking ?? null,
      contests: contest?.attendedContestsCount ?? 0,
      ratingHistory: history,
      dayCounts,
      recent,
      recentAcceptedSlugs: (data.recentAcSubmissionList ?? []).map((s) => s.titleSlug),
    },
  };
}

// ---------------------------------------------------------------- POTD

const POTD_QUERY = `
query { activeDailyCodingChallengeQuestion {
  date link
  question { title titleSlug difficulty acRate topicTags { name } }
} }`;

export async function fetchLeetCodePotd(): Promise<Potd> {
  const data = await gql<{
    activeDailyCodingChallengeQuestion: {
      date: string;
      link: string;
      question: { title: string; titleSlug: string; difficulty: Difficulty; acRate: number; topicTags: { name: string }[] };
    } | null;
  }>(POTD_QUERY);
  const d = data.activeDailyCodingChallengeQuestion;
  if (!d) throw new UpstreamError("No LeetCode daily problem today");
  return {
    platform: "leetcode",
    title: d.question.title,
    slug: d.question.titleSlug,
    url: `https://leetcode.com${d.link}`,
    difficulty: d.question.difficulty,
    tags: d.question.topicTags.map((t) => t.name),
    acRate: Math.round(d.question.acRate * 10) / 10,
    date: d.date,
  };
}

// ---------------------------------------------------------------- contests

export async function fetchLeetCodeContests() {
  const data = await gql<{ upcomingContests: { title: string; titleSlug: string; startTime: number; duration: number }[] }>(
    `query { upcomingContests { title titleSlug startTime duration } }`
  );
  return (data.upcomingContests ?? []).map((c) => ({
    id: `leetcode-${c.titleSlug}`,
    platform: "leetcode" as const,
    title: c.title,
    url: `https://leetcode.com/contest/${c.titleSlug}`,
    start: c.startTime * 1000,
    durationSec: c.duration,
  }));
}
