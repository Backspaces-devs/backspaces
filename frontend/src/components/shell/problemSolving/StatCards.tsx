// src/components/shell/problemSolving/StatCards.tsx — the four headline cards:
// Total Solved · Contests Attended (per platform) · Streak · Next Contest (live countdown).
"use client";

import { CalendarPlus, Flame } from "lucide-react";
import type { Contest, PlatformKey, StatsResponse } from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { googleCalendarUrl } from "./calendar";
import { useNow } from "./hooks";
import { PLATFORM_META, PlatformTag, Skeleton, cardClass, formatNumber, splitDuration } from "./ui";

const PLATFORMS: PlatformKey[] = ["leetcode", "codeforces", "codechef", "gfg"];

function StatCard({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn(cardClass, "p-4 sm:p-5 flex flex-col gap-3 min-h-[168px]")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">{label}</p>
        {icon}
      </div>
      {children}
    </div>
  );
}

function IconChip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="flex size-8 items-center justify-center rounded-lg"
      style={{ color, backgroundColor: `${color}1a` }}
    >
      {children}
    </span>
  );
}

/** Small ring that shows how the total splits across platforms. */
function SplitRing({ parts }: { parts: { value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const r = 15;
  const c = 2 * Math.PI * r;
  const visible = parts.filter((p) => p.value > 0);
  const lengths = visible.map((p) => (p.value / total) * c);
  const offsets = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <svg viewBox="0 0 40 40" className="size-10 -rotate-90" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      {visible.map((p, i) => (
        <circle
          key={i}
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={p.color}
          strokeWidth="5"
          strokeDasharray={`${lengths[i]} ${c - lengths[i]}`}
          strokeDashoffset={-offsets[i]}
        />
      ))}
    </svg>
  );
}

function CardSkeleton() {
  return (
    <div className={cn(cardClass, "p-4 sm:p-5 flex flex-col gap-4 min-h-[168px]")}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-full mt-auto" />
    </div>
  );
}

export function StatCards({
  stats,
  nextContest,
  contestsLoading,
}: {
  stats: StatsResponse | undefined;
  nextContest: Contest | null;
  contestsLoading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats ? (
        <>
          <TotalSolvedCard stats={stats} />
          <ContestsCard stats={stats} />
          <StreakCard stats={stats} />
        </>
      ) : (
        <>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      )}
      {contestsLoading && !nextContest ? <CardSkeleton /> : <NextContestCard contest={nextContest} />}
    </div>
  );
}

function TotalSolvedCard({ stats }: { stats: StatsResponse }) {
  const active = PLATFORMS.filter((p) => stats.platforms[p].status === "ok");
  return (
    <StatCard
      label="Total solved"
      icon={
        <SplitRing
          parts={active.map((p) => ({ value: stats.totals.byPlatform[p], color: PLATFORM_META[p].color }))}
        />
      }
    >
      <p className="font-mono text-3xl font-bold tracking-tight text-white">{formatNumber(stats.totals.solved)}</p>
      <div className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1.5">
        {active.map((p) => (
          <div key={p} className="flex items-center gap-1.5 text-[11px] text-white/45">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: PLATFORM_META[p].color }} />
            <span className="truncate">{PLATFORM_META[p].short}</span>
            <span className="ml-auto font-mono text-white/80">{formatNumber(stats.totals.byPlatform[p])}</span>
          </div>
        ))}
        {active.length === 0 && <p className="col-span-2 text-[11px] text-white/40">No platforms connected</p>}
      </div>
    </StatCard>
  );
}

function ContestsCard({ stats }: { stats: StatsResponse }) {
  // every connected platform gets a row — zero contests are shown (dimmed), not hidden
  const rows = PLATFORMS.filter((p) => stats.platforms[p].status !== "missing");
  return (
    <StatCard
      label="Contests attended"
      icon={
        <SplitRing
          parts={rows.map((p) => ({ value: stats.totals.contestsByPlatform[p], color: PLATFORM_META[p].color }))}
        />
      }
    >
      <div className="flex items-baseline gap-2">
        <p className="font-mono text-3xl font-bold tracking-tight text-white">{formatNumber(stats.totals.contests)}</p>
        <span className="text-xs text-white/40">across all platforms</span>
      </div>
      <div className="mt-auto space-y-1.5">
        {rows.length === 0 && <p className="text-[11px] text-white/40">No platforms connected</p>}
        {rows.map((p) => {
          const state = stats.platforms[p];
          const data = state.status === "ok" ? state.data : null;
          const count = stats.totals.contestsByPlatform[p];
          const detail = !data
            ? "unavailable"
            : count === 0
              ? "—"
              : data.rating
                ? `${formatNumber(data.rating)}${data.title ? ` · ${data.title}` : ""}`
                : "";
          return (
            <div
              key={p}
              className={cn("flex items-center gap-1.5 text-[11px]", count > 0 ? "text-white/45" : "text-white/30")}
              title={
                count === 0
                  ? `No rated contests on ${PLATFORM_META[p].label} yet`
                  : [detail, data?.maxRating ? `max ${formatNumber(data.maxRating)}` : ""].filter(Boolean).join(" · ")
              }
            >
              <span
                className={cn("size-1.5 shrink-0 rounded-full", count === 0 && "opacity-40")}
                style={{ backgroundColor: PLATFORM_META[p].color }}
              />
              <span className="w-7 shrink-0">{PLATFORM_META[p].short}</span>
              <span className={cn("w-8 shrink-0 font-mono", count > 0 ? "text-white/80" : "text-white/30")}>
                {formatNumber(count)}
              </span>
              <span className="ml-auto min-w-0 truncate text-right font-mono">{detail}</span>
            </div>
          );
        })}
      </div>
    </StatCard>
  );
}

function StreakCard({ stats }: { stats: StatsResponse }) {
  const { current, longest, activeToday, recentDays } = stats.streak;
  return (
    <StatCard
      label="Streak days"
      icon={
        <IconChip color="#FFA116">
          <Flame className="size-4" />
        </IconChip>
      }
    >
      <div className="flex items-baseline gap-2">
        <p className="font-mono text-3xl font-bold tracking-tight text-white">{current}</p>
        <span className="text-xs text-white/40">days</span>
      </div>
      <div className="flex items-center gap-1" aria-label="Last 14 days">
        {recentDays.map((d, i) => {
          const isToday = i === recentDays.length - 1;
          return (
            <span
              key={d.date}
              title={`${d.date}: ${d.count} submission${d.count === 1 ? "" : "s"}`}
              className={cn(
                "size-2.5 rounded-full",
                d.count > 0 ? "bg-[#FFA116]" : isToday ? "border border-white/40" : "bg-white/10"
              )}
            />
          );
        })}
      </div>
      <div className="mt-auto flex items-center justify-between text-[11px]">
        <span className={activeToday ? "text-emerald-400" : "text-[#FFA116]"}>
          {activeToday ? "Done for today ✓" : current > 0 ? "Solve one today to keep it alive!" : "Start a streak today"}
        </span>
        <span className="text-white/40">Longest: {longest}d</span>
      </div>
    </StatCard>
  );
}

function NextContestCard({ contest }: { contest: Contest | null }) {
  const now = useNow(); // ticks every second for the countdown
  if (!contest) {
    return (
      <StatCard label="Next contest">
        <p className="text-sm text-white/45">No upcoming contests found.</p>
      </StatCard>
    );
  }
  const live = now != null && contest.start <= now;
  const parts = now != null ? splitDuration(contest.start - now) : null;
  return (
    <StatCard
      label="Next contest"
      icon={
        live ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
          </span>
        ) : (
          <PlatformTag platform={contest.platform} />
        )
      }
    >
      <a
        href={contest.url}
        target="_blank"
        rel="noreferrer"
        className="line-clamp-2 text-sm font-semibold leading-snug text-white/90 hover:text-white"
      >
        {contest.title}
      </a>
      <div className="grid grid-cols-4 gap-1.5">
        {(["d", "h", "m", "s"] as const).map((k) => (
          <div key={k} className="rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 text-center">
            <p className="font-mono text-sm font-semibold text-[#18CCFC]">
              {parts ? String(parts[k]).padStart(2, "0") : "--"}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-white/35">
              {{ d: "days", h: "hrs", m: "min", s: "sec" }[k]}
            </p>
          </div>
        ))}
      </div>
      <a
        href={live ? contest.url : googleCalendarUrl(contest)}
        target="_blank"
        rel="noreferrer"
        className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
      >
        <CalendarPlus className="size-3.5" />
        {live ? "Join contest" : "Add to calendar"}
      </a>
    </StatCard>
  );
}
