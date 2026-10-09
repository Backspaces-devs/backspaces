// src/components/shell/problemSolving/RevisionQueue.tsx — spaced repetition.
// "Re-solve" opens the problem; afterwards you rate how it went and the
// backend's SM-2 scheduler picks the next review date. Retention is the
// Ebbinghaus estimate R = 0.9^(elapsed / interval) — 90% on the due date.
"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, Trash2, Zap } from "lucide-react";
import type { RevisionTask } from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { useNow } from "./hooks";
import { DifficultyPill, EmptyNote, ErrorNote, PLATFORM_META, Panel, Skeleton, timeAgo } from "./ui";

const DAY = 86_400_000;

const RATINGS = [
  { label: "Again", quality: 1, className: "text-red-300 hover:bg-red-400/10 border-red-400/20" },
  { label: "Hard", quality: 3, className: "text-amber-300 hover:bg-amber-400/10 border-amber-400/20" },
  { label: "Good", quality: 4, className: "text-sky-300 hover:bg-sky-400/10 border-sky-400/20" },
  { label: "Easy", quality: 5, className: "text-emerald-300 hover:bg-emerald-400/10 border-emerald-400/20" },
];

function retention(task: RevisionTask, now: number) {
  const elapsed = Math.max(0, (now - Date.parse(task.lastReviewedAt)) / DAY);
  return Math.round(100 * Math.pow(0.9, elapsed / Math.max(task.intervalDays, 1)));
}

function retentionColor(r: number) {
  if (r < 50) return "text-red-400";
  if (r < 80) return "text-amber-400";
  return "text-emerald-400";
}

function dueIn(ts: number, now: number) {
  const days = Math.ceil((ts - now) / DAY);
  if (days <= 1) return "tomorrow";
  return `in ${days}d`;
}

interface RevisionQueueProps {
  tasks: RevisionTask[];
  status: "loading" | "ready" | "error";
  error: string | null;
  onReview: (id: string, quality: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onRetry: () => void;
}

export function RevisionQueue({ tasks, status, error, onReview, onRemove, onRetry }: RevisionQueueProps) {
  const now = useNow();
  const [rating, setRating] = useState<string | null>(null); // task id waiting for a rating
  const [busy, setBusy] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const t = now ?? 0;
  const due = tasks
    .filter((x) => Date.parse(x.nextReviewAt) <= t)
    .sort((a, b) => Date.parse(a.nextReviewAt) - Date.parse(b.nextReviewAt));
  const upcoming = tasks
    .filter((x) => Date.parse(x.nextReviewAt) > t)
    .sort((a, b) => Date.parse(a.nextReviewAt) - Date.parse(b.nextReviewAt));

  const submit = async (id: string, quality: number) => {
    setBusy(id);
    setActionError(null);
    try {
      await onReview(id, quality);
      setRating(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title="Revision queue"
      subtitle={
        status === "ready" ? (
          <>
            Spaced repetition (SM-2) ·{" "}
            <span className={due.length ? "text-[#FFA116]" : ""}>
              {due.length} due {due.length === 1 ? "problem" : "problems"}
            </span>
          </>
        ) : (
          "Spaced repetition (SM-2)"
        )
      }
      action={
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#18CCFC]/10 text-[#18CCFC]">
          <Zap className="size-4" />
        </span>
      }
    >
      {status === "loading" ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : status === "error" ? (
        <div className="space-y-2">
          <ErrorNote message={error ?? "Could not load the revision queue."} onRetry={onRetry} />
          <p className="text-[11px] text-white/35">
            The revision queue is saved in MongoDB through the backend — make sure the backend is running and
            API_URL is set.
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyNote>
          Nothing to revise yet. Hit the ↺ button on a recent submission or a sheet problem to schedule it here.
        </EmptyNote>
      ) : (
        <div className="space-y-2">
          {actionError && <ErrorNote message={actionError} />}
          {due.length === 0 && (
            <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2.5 text-xs text-emerald-300">
              All caught up! Next review {upcoming[0] ? dueIn(Date.parse(upcoming[0].nextReviewAt), t) : "—"}.
            </p>
          )}
          {due.slice(0, 5).map((task) => {
            const r = retention(task, t);
            return (
              <div key={task._id} className="group rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: PLATFORM_META[task.platform].color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-[13px] font-semibold text-white/90 sm:truncate">{task.title}</p>
                      <DifficultyPill difficulty={task.difficulty} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      Last solved {timeAgo(Date.parse(task.lastReviewedAt), now)} ·{" "}
                      <span className={retentionColor(r)}>Retention ~{r}%</span>
                    </p>
                    {task.topics.length > 0 && (
                      <p className="mt-0.5 truncate text-[11px] text-[#18CCFC]/80">{task.topics.join(" · ")}</p>
                    )}
                  </div>
                  {rating !== task._id && (
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setRating(task._id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Re-solve <ArrowUpRight className="size-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(task._id)}
                    title="Remove from queue"
                    aria-label="Remove from queue"
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white/25 hover:bg-white/10 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                {rating === task._id && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-3">
                    <span className="mr-1 text-[11px] text-white/45">How did it go?</span>
                    {RATINGS.map((x) => (
                      <button
                        key={x.label}
                        disabled={busy === task._id}
                        onClick={() => submit(task._id, x.quality)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
                          x.className
                        )}
                      >
                        {x.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setRating(null)}
                      className="ml-auto text-[11px] text-white/35 hover:text-white"
                    >
                      Later
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {due.length > 5 && <p className="px-1 text-[11px] text-white/35">+{due.length - 5} more due</p>}

          {upcoming.length > 0 && (
            <div className="pt-1">
              <button
                onClick={() => setShowUpcoming((s) => !s)}
                className="flex w-full items-center justify-between px-1 py-1 text-[11px] font-medium text-white/45 hover:text-white"
              >
                Upcoming ({upcoming.length})
                <ChevronDown className={cn("size-3.5 transition-transform", showUpcoming && "rotate-180")} />
              </button>
              {showUpcoming && (
                <div className="max-h-[200px] space-y-0.5 overflow-y-auto">
                  {upcoming.map((task) => (
                    <div key={task._id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate text-xs text-white/70 hover:text-white"
                      >
                        {task.title}
                      </a>
                      <span className="font-mono text-[10px] text-white/35">
                        {dueIn(Date.parse(task.nextReviewAt), t)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(task._id)}
                        aria-label="Remove from queue"
                        className="text-white/20 opacity-0 group-hover:opacity-100 hover:text-red-300"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
