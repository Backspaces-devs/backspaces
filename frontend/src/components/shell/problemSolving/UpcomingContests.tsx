// src/components/shell/problemSolving/UpcomingContests.tsx — next contests on
// LeetCode, Codeforces and CodeChef, with Google Calendar reminders and a
// combined .ics export.
"use client";

import { useState } from "react";
import { BellPlus, ChevronDown, Download } from "lucide-react";
import type { Contest, ContestsResponse, PlatformKey } from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { downloadIcs, googleCalendarUrl } from "./calendar";
import { useNow } from "./hooks";
import {
  EmptyNote,
  ErrorNote,
  PLATFORM_META,
  Panel,
  PlatformIcon,
  Skeleton,
  TextButton,
  formatContestDate,
  startsIn,
} from "./ui";

const FILTERS: ("all" | PlatformKey)[] = ["all", "leetcode", "codeforces", "codechef"];

export function UpcomingContests({
  data,
  loading,
  error,
  onRetry,
}: {
  data: ContestsResponse | undefined;
  loading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  const now = useNow();
  const [filter, setFilter] = useState<"all" | PlatformKey>("all");
  const [expanded, setExpanded] = useState(false);

  const all = data?.contests ?? [];
  const filtered = filter === "all" ? all : all.filter((c) => c.platform === filter);
  const shown = expanded ? filtered.slice(0, 15) : filtered.slice(0, 4);
  const failed = Object.keys(data?.errors ?? {}) as PlatformKey[];

  return (
    <Panel
      title="Upcoming contests"
      subtitle="LeetCode · Codeforces · CodeChef"
      action={
        filtered.length > 0 && (
          <TextButton onClick={() => downloadIcs(filtered.slice(0, 15))}>
            <Download className="size-3.5" /> .ics
          </TextButton>
        )
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              filter === f
                ? "border-white/15 bg-white/15 text-white"
                : "border-white/[0.08] bg-white/[0.04] text-white/45 hover:text-white"
            )}
          >
            {f === "all" ? "All" : PLATFORM_META[f].short}
          </button>
        ))}
      </div>

      {error && !data ? (
        <ErrorNote message={error} onRetry={onRetry} />
      ) : loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyNote>No upcoming contests found.</EmptyNote>
      ) : (
        <div className={cn("space-y-1", expanded && "max-h-[360px] overflow-y-auto pr-1")}>
          {shown.map((c) => (
            <ContestRow key={c.id} contest={c} now={now} />
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        {failed.length > 0 ? (
          <p className="text-[10px] text-white/30">
            Couldn&apos;t reach {failed.map((p) => PLATFORM_META[p].label).join(", ")}
          </p>
        ) : (
          <span />
        )}
        {filtered.length > 4 && (
          <TextButton onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Show less" : `View all (${Math.min(filtered.length, 15)})`}
            <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
          </TextButton>
        )}
      </div>
    </Panel>
  );
}

function ContestRow({ contest, now }: { contest: Contest; now: number | null }) {
  const live = now != null && contest.start <= now;
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04] transition-colors">
      <PlatformIcon platform={contest.platform} size={14} />
      <div className="min-w-0 flex-1">
        <a
          href={contest.url}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-[13px] font-medium text-white/90 hover:text-white"
        >
          {contest.title}
        </a>
        <p className="text-[11px] text-white/40">
          {formatContestDate(contest.start)} ·{" "}
          <span className={live ? "text-emerald-400" : "text-white/55"}>{startsIn(contest.start, now)}</span>
        </p>
      </div>
      {!live && (
        <a
          href={googleCalendarUrl(contest)}
          target="_blank"
          rel="noreferrer"
          title="Add a reminder to Google Calendar"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <BellPlus className="size-3" /> Remind
        </a>
      )}
    </div>
  );
}
