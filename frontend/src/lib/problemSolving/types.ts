// src/lib/problemSolving/types.ts — shared shapes for the Problem Solving page.
// Safe to import from both server code (API routes) and client components.
// Every external platform is normalised into these types before it reaches the UI.

export type PlatformKey = "leetcode" | "codeforces" | "codechef" | "gfg";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface DifficultySplit {
  easy: number;
  medium: number;
  hard: number;
}

/** "ac" = accepted, "wa" = wrong answer, "tle"/"mle"/"re"/"ce" = other failures. */
export type VerdictKind = "ac" | "wa" | "tle" | "mle" | "re" | "ce" | "other";

export interface Activity {
  platform: PlatformKey;
  title: string;
  url: string;
  slug?: string;
  status: string; // human label, e.g. "Accepted", "Wrong Answer"
  verdict: VerdictKind;
  difficulty: Difficulty | null;
  rating?: number | null; // Codeforces problem rating
  lang?: string | null;
  timestamp: number; // ms epoch
}

export interface RatingPoint {
  t: number; // ms epoch
  rating: number;
  contest: string;
}

export interface PlatformStats {
  platform: PlatformKey;
  handle: string;
  profileUrl: string;
  displayName?: string | null;
  solved: number;
  difficulty: DifficultySplit | null; // null when the platform has no difficulty data
  rating: number | null;
  maxRating: number | null;
  title: string | null; // "Specialist", "Knight", "2★", …
  globalRank: number | null;
  contests: number;
  ratingHistory: RatingPoint[];
  /** "YYYY-MM-DD" (in STREAK_TIMEZONE) → submissions that day */
  dayCounts: Record<string, number>;
  recent: Activity[];
  /** LeetCode only: up to 20 most recent accepted slugs (used for POTD + sheet auto-sync) */
  recentAcceptedSlugs?: string[];
  /** GFG only: every solved problem slug */
  solvedSlugs?: string[];
}

export type PlatformState =
  | { status: "ok"; data: PlatformStats }
  | { status: "error"; handle: string; error: string }
  | { status: "missing"; envKey: string };

export interface TopicStat {
  name: string;
  slug: string;
  solved: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  activeToday: boolean;
  totalActiveDays: number;
  /** last 14 days, oldest → newest */
  recentDays: { date: string; count: number }[];
}

export interface StatsResponse {
  fetchedAt: string;
  platforms: Record<PlatformKey, PlatformState>;
  totals: {
    solved: number;
    contests: number;
    difficulty: DifficultySplit;
    byPlatform: Record<PlatformKey, number>;
    contestsByPlatform: Record<PlatformKey, number>;
  };
  streak: StreakInfo;
  topics: TopicStat[];
  ratingHistory: Partial<Record<PlatformKey, RatingPoint[]>>;
  activity: Activity[];
  displayName: string | null;
}

export interface Contest {
  id: string;
  platform: PlatformKey;
  title: string;
  url: string;
  start: number; // ms epoch
  durationSec: number;
}

export interface ContestsResponse {
  fetchedAt: string;
  contests: Contest[];
  errors: Partial<Record<PlatformKey, string>>;
}

export interface Potd {
  platform: "leetcode" | "gfg";
  title: string;
  slug: string;
  url: string;
  difficulty: Difficulty | null;
  tags: string[];
  acRate: number | null; // percent
  date: string; // YYYY-MM-DD
}

export interface PotdResponse {
  fetchedAt: string;
  problems: Potd[];
  errors: Partial<Record<"leetcode" | "gfg", string>>;
}

// ---- Revision queue (MongoDB via the Express backend) ----

export interface RevisionTask {
  _id: string;
  title: string;
  platform: PlatformKey | "other";
  url: string;
  slug: string;
  difficulty: Difficulty | null;
  topics: string[];
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lastReviewedAt: string; // ISO
  nextReviewAt: string; // ISO
  createdAt: string;
}

export interface NewRevisionTask {
  title: string;
  platform: PlatformKey | "other";
  url: string;
  slug: string;
  difficulty?: Difficulty | null;
  topics?: string[];
}

// ---- DSA sheets (static JSON + progress in MongoDB) ----

export interface SheetProblem {
  id: string;
  title: string;
  difficulty: Difficulty | null;
  platform: "LeetCode" | "Other";
  url: string;
  slug?: string;
}

export interface Sheet {
  id: string;
  name: string;
  description: string;
  total: number;
  sections: { title: string; problems: SheetProblem[] }[];
}

/** sheetId → completed problem ids */
export type SheetProgress = Record<string, string[]>;
