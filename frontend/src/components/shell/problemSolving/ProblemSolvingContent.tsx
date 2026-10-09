// src/components/shell/problemSolving/ProblemSolvingContent.tsx — client
// container for /problemSolving. Loads live data from the BFF routes
// (/api/problem-solving/*) and lays out every card.
//
// Data sources (all server-side, see src/lib/problemSolving/):
//   stats     → LeetCode GraphQL · Codeforces API · CodeChef profile · GFG practice API
//   contests  → LeetCode · Codeforces · CodeChef contest lists
//   potd      → LeetCode daily + GFG problem of the day
//   revision / sheets → Express backend (MongoDB) via API_URL
// Handles come from LEETCODE_USERNAME / CODEFORCES_USERNAME / CODECHEF_USERNAME / GFG_USERNAME.
"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import type {
  Activity,
  ContestsResponse,
  NewRevisionTask,
  PlatformKey,
  PotdResponse,
  StatsResponse,
} from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { useApi, useNow, useRevisionQueue, useSheetProgress } from "./hooks";
import { PotdBanner } from "./PotdBanner";
import { StatCards } from "./StatCards";
import { RatingGraph } from "./RatingGraph";
import { DifficultyDonut } from "./DifficultyDonut";
import { TopicsCovered } from "./TopicsCovered";
import { UpcomingContests } from "./UpcomingContests";
import { RecentActivity, activityKey } from "./RecentActivity";
import { SheetTracker } from "./SheetTracker";
import { RevisionQueue } from "./RevisionQueue";
import { ErrorNote, PLATFORM_META, PlatformIcon, timeAgo } from "./ui";

const PLATFORMS: PlatformKey[] = ["leetcode", "codeforces", "codechef", "gfg"];

function greeting(hour: number) {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function ProblemSolvingContent() {
  const stats = useApi<StatsResponse>("/api/problem-solving/stats");
  const contests = useApi<ContestsResponse>("/api/problem-solving/contests");
  const potd = useApi<PotdResponse>("/api/problem-solving/potd");
  const sheets = useSheetProgress();
  const revision = useRevisionQueue();

  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const showToast = useCallback((ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const s = stats.data;
  const syncing = stats.loading || contests.loading || potd.loading;

  const sync = () => {
    stats.refresh();
    contests.refresh();
    potd.refresh();
    void revision.reload();
  };

  // ---- derived data
  const lc = s?.platforms.leetcode.status === "ok" ? s.platforms.leetcode.data : null;
  const gfg = s?.platforms.gfg.status === "ok" ? s.platforms.gfg.data : null;

  const solvedSlugs = useMemo(() => {
    const today = lc?.recent.filter((a) => a.verdict === "ac").map((a) => a.slug ?? "") ?? [];
    return {
      leetcode: new Set([...(lc?.recentAcceptedSlugs ?? []), ...today]),
      gfg: new Set(gfg?.solvedSlugs ?? []),
    };
  }, [lc, gfg]);

  // the server already drops finished contests and sorts by start time
  const nextContest = contests.data?.contests[0] ?? null;

  const queuedKeys = useMemo(
    () => new Set(revision.tasks.map((t) => activityKey(t.platform, t.slug))),
    [revision.tasks]
  );

  const addToRevision = useCallback(
    async (task: NewRevisionTask & { solvedAt?: number }) => {
      try {
        await revision.add(task);
        showToast(true, `“${task.title}” added to your revision queue`);
      } catch (err) {
        showToast(false, err instanceof Error ? err.message : "Could not add to revision queue");
      }
    },
    [revision, showToast]
  );

  const addActivityToRevision = useCallback(
    (a: Activity) =>
      addToRevision({
        title: a.title,
        platform: a.platform,
        slug: a.slug ?? a.title,
        url: a.url,
        difficulty: a.difficulty,
        topics: [],
        solvedAt: a.verdict === "ac" ? a.timestamp : undefined,
      }),
    [addToRevision]
  );

  const firstName = s?.displayName?.trim().split(/\s+/)[0];
  const name =
    (firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : null) ??
    PLATFORMS.map((p) => (s?.platforms[p].status === "ok" ? s.platforms[p].data.handle : null)).find(Boolean) ??
    "there";

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto pb-12">
      {toast && (
        <div
          className={cn(
            "fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2",
            toast.ok ? "border-emerald-400/30 bg-emerald-500/95" : "border-red-400/30 bg-red-500/95"
          )}
        >
          {toast.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <Header name={name} fetchedAt={s?.fetchedAt} syncing={syncing} onSync={sync} />

      {/* platform connection status */}
      {s && (
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const st = s.platforms[p];
            const meta = PLATFORM_META[p];
            const content = (
              <>
                <PlatformIcon platform={p} size={12} />
                <span className="text-white/70">
                  {st.status === "missing" ? meta.label : st.status === "ok" ? st.data.handle : st.handle}
                </span>
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    st.status === "ok" ? "bg-emerald-400" : st.status === "error" ? "bg-red-400" : "bg-white/25"
                  )}
                />
              </>
            );
            const title =
              st.status === "ok"
                ? `${meta.label}: connected`
                : st.status === "error"
                  ? `${meta.label}: ${st.error}`
                  : `${meta.label}: add ${st.envKey} to your .env`;
            const cls =
              "inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-3 text-[11px] hover:bg-white/[0.06] transition-colors";
            return st.status === "ok" ? (
              <a key={p} href={st.data.profileUrl} target="_blank" rel="noreferrer" title={title} className={cls}>
                {content}
              </a>
            ) : (
              <span key={p} title={title} className={cn(cls, "cursor-help")}>
                {content}
              </span>
            );
          })}
        </div>
      )}

      {stats.error && !s && <ErrorNote message={stats.error} onRetry={stats.refresh} />}

      <PotdBanner
        problems={potd.data?.problems}
        loading={potd.loading}
        error={potd.error ?? (potd.data && !potd.data.problems.length ? "No problem of the day available" : undefined)}
        solvedSlugs={solvedSlugs}
        onRetry={potd.refresh}
      />

      <StatCards stats={s} nextContest={nextContest} contestsLoading={contests.loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RatingGraph stats={s} />
        <DifficultyDonut stats={s} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <TopicsCovered topics={s?.topics} loading={stats.loading} />
        <UpcomingContests
          data={contests.data}
          loading={contests.loading}
          error={contests.error}
          onRetry={contests.refresh}
        />
        <RecentActivity
          activity={s?.activity}
          loading={stats.loading}
          queuedKeys={queuedKeys}
          revisionAvailable={revision.status === "ready"}
          onAddToRevision={addActivityToRevision}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SheetTracker
          progress={sheets.progress}
          mode={sheets.mode}
          onUpdate={sheets.update}
          recentAcceptedSlugs={lc?.recentAcceptedSlugs}
          queuedKeys={queuedKeys}
          revisionAvailable={revision.status === "ready"}
          onAddToRevision={addToRevision}
        />
        <RevisionQueue
          tasks={revision.tasks}
          status={revision.status}
          error={revision.error}
          onReview={revision.review}
          onRemove={revision.remove}
          onRetry={() => void revision.reload()}
        />
      </div>
    </div>
  );
}

/** Date + greeting + Sync button. Owns the clock so only this re-renders every second. */
function Header({
  name,
  fetchedAt,
  syncing,
  onSync,
}: {
  name: string;
  fetchedAt?: string;
  syncing: boolean;
  onSync: () => void;
}) {
  const now = useNow();
  const date = now ? new Date(now) : null;
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="min-h-4 text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
          {date?.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
          {date ? greeting(date.getHours()) : "Hello"}, {name} <span className="text-[#18CCFC]">✦</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your consistency is your superpower. Keep the momentum going.
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 md:items-end">
        <button
          onClick={onSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-60"
        >
          <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
          {syncing ? "Syncing…" : "Sync profiles"}
        </button>
        {fetchedAt && <p className="text-[10px] text-white/30">Updated {timeAgo(Date.parse(fetchedAt), now)}</p>}
      </div>
    </div>
  );
}
