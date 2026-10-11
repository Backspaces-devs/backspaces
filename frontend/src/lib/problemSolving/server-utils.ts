// src/lib/problemSolving/server-utils.ts — server-only helpers shared by the
// platform fetchers: env handles, a small TTL cache, HTTP helpers, date keys.
// SERVER ONLY — reads process.env; import it from API routes, never from client components.
import type { Difficulty, PlatformKey, VerdictKind } from "./types";

// ---------------------------------------------------------------- handles

export const HANDLE_ENV: Record<PlatformKey, string> = {
  leetcode: "LEETCODE_USERNAME",
  codeforces: "CODEFORCES_USERNAME",
  codechef: "CODECHEF_USERNAME",
  gfg: "GFG_USERNAME",
};

/** Reads LEETCODE_USERNAME / CODEFORCES_USERNAME / CODECHEF_USERNAME / GFG_USERNAME. */
export function getHandle(platform: PlatformKey): string | null {
  const value = process.env[HANDLE_ENV[platform]]?.trim();
  return value ? value : null;
}

/** Owner id used for revision-queue / sheet-progress documents in MongoDB. */
export function getOwnerId(): string {
  return (
    getHandle("leetcode") ??
    getHandle("codeforces") ??
    getHandle("codechef") ??
    getHandle("gfg") ??
    "default"
  );
}

// ---------------------------------------------------------------- TTL cache
// In-memory, per server instance. Keeps us well inside the platforms' rate
// limits (Codeforces allows ~1 call / 2s per IP) and makes reloads instant.

interface CacheEntry<T> {
  value?: T;
  storedAt: number;
  pending?: Promise<T>;
}

const store = new Map<string, CacheEntry<unknown>>();

/** Minimum age before a forced refresh (Sync button) is allowed to hit upstream again. */
const MIN_FORCE_REFRESH_MS = 60_000;

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  opts: { force?: boolean } = {}
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry?.pending) return entry.pending;

  if (entry && entry.value !== undefined) {
    const age = now - entry.storedAt;
    const fresh = age < ttlMs;
    const forceAllowed = opts.force && age >= MIN_FORCE_REFRESH_MS;
    if (fresh && !forceAllowed) return entry.value;
  }

  const pending = loader()
    .then((value) => {
      store.set(key, { value, storedAt: Date.now() });
      return value;
    })
    .catch((err) => {
      // keep the stale value (if any) so the next request can still serve it
      if (entry && entry.value !== undefined) store.set(key, { value: entry.value, storedAt: entry.storedAt });
      else store.delete(key);
      throw err;
    });

  store.set(key, { ...(entry ?? { storedAt: 0 }), pending });
  return pending;
}

// ---------------------------------------------------------------- HTTP

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export class UpstreamError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export async function httpFetch(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 15_000, headers, ...rest } = init;
  try {
    return await fetch(url, {
      ...rest,
      cache: "no-store",
      headers: { "User-Agent": UA, Accept: "application/json, text/html;q=0.9", ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    throw new UpstreamError(timedOut ? "Request timed out" : "Network error");
  }
}

export async function fetchJson<T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const res = await httpFetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok && body === null) throw new UpstreamError(`HTTP ${res.status}`, res.status);
  return body as T;
}

export async function fetchText(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<string> {
  const res = await httpFetch(url, init);
  if (!res.ok) throw new UpstreamError(`HTTP ${res.status}`, res.status);
  return res.text();
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

// ---------------------------------------------------------------- dates
// Streaks are counted in one timezone so "today" means the same thing for
// every platform. Override with STREAK_TIMEZONE in .env if needed.

export const STREAK_TIMEZONE = process.env.STREAK_TIMEZONE || "Asia/Kolkata";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STREAK_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** ms epoch → "YYYY-MM-DD" in STREAK_TIMEZONE */
export function dayKey(ms: number): string {
  return dayFormatter.format(new Date(ms));
}

export function addDayCount(map: Record<string, number>, key: string, n = 1) {
  map[key] = (map[key] ?? 0) + n;
}

// ---------------------------------------------------------------- normalisers

/** Codeforces problem rating → Easy / Medium / Hard bucket. */
export function cfRatingToDifficulty(rating?: number | null): Difficulty | null {
  if (!rating) return null;
  if (rating <= 1200) return "Easy";
  if (rating <= 1800) return "Medium";
  return "Hard";
}

/**
 * CodeChef problem difficulty rating → bucket, using CodeChef's own star bands:
 * below 1400 (beginner, 1★) Easy · 1400–1999 (2★–4★) Medium · 2000+ (5★+) Hard.
 */
export function ccRatingToDifficulty(rating?: number | null): Difficulty | null {
  if (!rating || rating <= 0) return null;
  if (rating < 1400) return "Easy";
  if (rating < 2000) return "Medium";
  return "Hard";
}

/** CodeChef practice category ("school", "easy", "medium", "hard", "challenge") → bucket. */
export function ccCategoryToDifficulty(category?: string | null): Difficulty | null {
  const v = category?.toLowerCase().trim();
  if (!v) return null;
  if (v === "school" || v === "beginner" || v === "cakewalk" || v === "easy") return "Easy";
  if (v === "medium") return "Medium";
  if (v === "hard" || v === "challenge") return "Hard";
  return null;
}

export function normaliseDifficulty(value?: string | null): Difficulty | null {
  const v = value?.toLowerCase();
  if (!v) return null;
  if (v === "school" || v === "basic" || v === "easy") return "Easy";
  if (v === "medium") return "Medium";
  if (v === "hard") return "Hard";
  return null;
}

export function verdictFromLabel(label: string): VerdictKind {
  const v = label.toLowerCase();
  if (v.startsWith("accepted") || v === "ok" || v === "ac" || v.includes("correct")) return "ac";
  if (v.includes("wrong")) return "wa";
  if (v.includes("time")) return "tle";
  if (v.includes("memory")) return "mle";
  if (v.includes("runtime")) return "re";
  if (v.includes("compil")) return "ce";
  return "other";
}
