// src/components/shell/problemSolving/RecentActivity.tsx — latest submissions
// from every platform, newest first. Each row can be pushed into the
// revision queue.
"use client";

import { useState } from "react";
import { Check, ChevronDown, RotateCcw } from "lucide-react";
import type { Activity, PlatformKey } from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { useNow } from "./hooks";
import {
  DifficultyPill,
  EmptyNote,
  PLATFORM_META,
  Panel,
  Skeleton,
  TextButton,
  VERDICT_COLOR,
  timeAgo,
} from "./ui";

interface RecentActivityProps {
  activity: Activity[] | undefined;
  loading: boolean;
  queuedKeys: Set<string>;
  revisionAvailable: boolean;
  onAddToRevision: (a: Activity) => Promise<void>;
}

export const activityKey = (platform: PlatformKey | "other", slug: string) => `${platform}:${slug}`;

export function RecentActivity({
  activity,
  loading,
  queuedKeys,
  revisionAvailable,
  onAddToRevision,
}: RecentActivityProps) {
  const now = useNow();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const list = activity ?? [];
  const shown = expanded ? list : list.slice(0, 6);

  return (
    <Panel
      title="Recent activity"
      subtitle={
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-400" /> Across all platforms
        </span>
      }
    >
      {loading && !activity ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyNote>No recent submissions found.</EmptyNote>
      ) : (
        <div className={cn("space-y-1", expanded && "max-h-[360px] overflow-y-auto pr-1")}>
          {shown.map((a) => {
            const key = activityKey(a.platform, a.slug ?? a.title);
            const queued = queuedKeys.has(key);
            return (
              <div
                key={`${a.platform}-${a.timestamp}-${a.slug}`}
                className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04] transition-colors"
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: VERDICT_COLOR[a.verdict] }} />
                <div className="min-w-0 flex-1">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[13px] font-medium text-white/90 hover:text-white"
                  >
                    {a.title}
                  </a>
                  <p className="truncate text-[11px] text-white/40">
                    <span style={{ color: VERDICT_COLOR[a.verdict] }}>{a.status}</span>
                    {" · "}
                    {PLATFORM_META[a.platform].label}
                    {a.rating ? ` · ${a.rating}` : ""}
                    {" · "}
                    {timeAgo(a.timestamp, now)}
                  </p>
                </div>
                <DifficultyPill difficulty={a.difficulty} />
                {revisionAvailable && (
                  <button
                    type="button"
                    disabled={queued || busy === key}
                    title={queued ? "In your revision queue" : "Add to revision queue"}
                    aria-label={queued ? "In your revision queue" : "Add to revision queue"}
                    onClick={async () => {
                      setBusy(key);
                      await onAddToRevision(a).finally(() => setBusy(null));
                    }}
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
                      queued
                        ? "text-emerald-400"
                        : "text-white/30 opacity-100 sm:opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {queued ? (
                      <Check className="size-3.5" />
                    ) : (
                      <RotateCcw className={cn("size-3.5", busy === key && "animate-spin")} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {list.length > 6 && (
        <div className="mt-auto flex justify-end pt-3">
          <TextButton onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Show less" : `Show all (${list.length})`}
            <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
          </TextButton>
        </div>
      )}
    </Panel>
  );
}
