// src/components/shell/problemSolving/hooks.ts — client hooks for the Problem
// Solving page: JSON fetching with refresh, a shared 1s clock, sheet progress
// and the revision queue (both persisted through /api/problem-solving/*).
"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { NewRevisionTask, RevisionTask, SheetProgress } from "@/lib/problemSolving/types";

// ---------------------------------------------------------------- fetch helper

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

interface ApiState<T> {
  key: string;
  data?: T;
  error?: string;
}

/**
 * GETs `url` on mount. `refresh()` re-fetches with ?refresh=1 (bypasses the
 * server cache) while keeping the previous data on screen. `reload()` is a
 * quiet background re-fetch: no loading state, and errors keep the old data.
 */
export function useApi<T>(url: string) {
  const [nonce, setNonce] = useState(0);
  const [soft, setSoft] = useState(0);
  const [state, setState] = useState<ApiState<T> | null>(null);
  const key = `${url}#${nonce}`;

  useEffect(() => {
    const ctrl = new AbortController();
    const target = nonce > 0 ? `${url}${url.includes("?") ? "&" : "?"}refresh=1` : url;
    const background = soft > 0;
    requestJson<T>(target, { signal: ctrl.signal }).then(
      (data) => setState({ key, data }),
      (err: Error) => {
        if (ctrl.signal.aborted) return;
        setState((prev) =>
          background && prev?.key === key && prev.data !== undefined ? prev : { key, data: prev?.data, error: err.message }
        );
      }
    );
    return () => ctrl.abort();
  }, [url, nonce, key, soft]);

  const loading = state?.key !== key;
  return {
    data: state?.data,
    error: loading ? undefined : state?.error,
    loading,
    refresh: useCallback(() => setNonce((n) => n + 1), []),
    reload: useCallback(() => setSoft((n) => n + 1), []),
  };
}

// ---------------------------------------------------------------- shared clock
// One interval for the whole page; null during SSR/hydration so server and
// client markup always match.

let clockNow = 0;
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | undefined;

function subscribeClock(cb: () => void) {
  clockListeners.add(cb);
  if (!clockTimer) {
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    clockListeners.delete(cb);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

export function useNow(): number | null {
  return useSyncExternalStore(
    subscribeClock,
    () => clockNow || Date.now(),
    () => null
  );
}

// ---------------------------------------------------------------- sheet progress
// Saved in MongoDB through the backend. If the backend is down/unconfigured,
// progress falls back to localStorage so the tracker still works.

const LOCAL_SHEETS_KEY = "backspaces:sheet-progress";

function readLocal(): SheetProgress {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SHEETS_KEY) ?? "{}") as SheetProgress;
  } catch {
    return {};
  }
}

function applyChange(progress: SheetProgress, sheetId: string, ids: string[], done: boolean): SheetProgress {
  const set = new Set(progress[sheetId] ?? []);
  for (const id of ids) {
    if (done) set.add(id);
    else set.delete(id);
  }
  return { ...progress, [sheetId]: [...set] };
}

export function useSheetProgress() {
  const [progress, setProgress] = useState<SheetProgress>({});
  const [mode, setModeState] = useState<"loading" | "remote" | "local">("loading");
  // the ref is updated together with the state so update() always sees the
  // current mode — even when a child effect calls it in the same commit
  const modeRef = useRef(mode);
  const setMode = useCallback((m: "loading" | "remote" | "local") => {
    modeRef.current = m;
    setModeState(m);
  }, []);

  useEffect(() => {
    let cancelled = false;
    requestJson<SheetProgress>("/api/problem-solving/sheets").then(
      (data) => {
        if (cancelled) return;
        setProgress(data ?? {});
        setMode("remote");
      },
      () => {
        if (cancelled) return;
        setProgress(readLocal());
        setMode("local");
      }
    );
    return () => {
      cancelled = true;
    };
  }, [setMode]);

  const update = useCallback(async (sheetId: string, problemIds: string[], done: boolean) => {
    if (problemIds.length === 0) return;
    // optimistic
    setProgress((prev) => {
      const next = applyChange(prev, sheetId, problemIds, done);
      if (modeRef.current === "local") localStorage.setItem(LOCAL_SHEETS_KEY, JSON.stringify(next));
      return next;
    });
    if (modeRef.current !== "remote") return;
    try {
      const saved = await requestJson<SheetProgress>("/api/problem-solving/sheets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, problemIds, done }),
      });
      // merge rather than replace, so concurrent updates for other sheets aren't lost
      setProgress((prev) => ({ ...prev, [sheetId]: saved[sheetId] ?? [] }));
    } catch {
      // keep the optimistic state; switch to local so nothing is lost
      setMode("local");
      setProgress((prev) => {
        localStorage.setItem(LOCAL_SHEETS_KEY, JSON.stringify(prev));
        return prev;
      });
    }
  }, [setMode]);

  return { progress, mode, update };
}

// ---------------------------------------------------------------- revision queue

export function useRevisionQueue() {
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return requestJson<RevisionTask[]>("/api/problem-solving/revision").then(
      (data) => {
        setTasks(data);
        setStatus("ready");
        setError(null);
      },
      (err: Error) => {
        setStatus("error");
        setError(err.message);
      }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    requestJson<RevisionTask[]>("/api/problem-solving/revision").then(
      (data) => {
        if (cancelled) return;
        setTasks(data);
        setStatus("ready");
      },
      (err: Error) => {
        if (cancelled) return;
        setStatus("error");
        setError(err.message);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(async (task: NewRevisionTask & { solvedAt?: number }) => {
    const saved = await requestJson<RevisionTask>("/api/problem-solving/revision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    setTasks((prev) => [...prev.filter((t) => t._id !== saved._id), saved]);
    return saved;
  }, []);

  const review = useCallback(async (id: string, quality: number) => {
    const saved = await requestJson<RevisionTask>(`/api/problem-solving/revision/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quality }),
    });
    setTasks((prev) => prev.map((t) => (t._id === id ? saved : t)));
  }, []);

  const remove = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    await requestJson(`/api/problem-solving/revision/${id}`, { method: "DELETE" }).catch(() => load());
  }, [load]);

  return { tasks, status, error, add, review, remove, reload: load };
}
