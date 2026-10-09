// src/components/shell/problemSolving/PotdBanner.tsx — today's LeetCode + GFG
// problem of the day. Marks a problem "Solved" when it shows up in your
// recent accepted submissions.
"use client";

import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import type { Potd } from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { DifficultyPill, ErrorNote, PlatformIcon, PLATFORM_META, Skeleton, cardClass } from "./ui";

interface PotdBannerProps {
  problems: Potd[] | undefined;
  loading: boolean;
  error?: string;
  solvedSlugs: { leetcode: Set<string>; gfg: Set<string> };
  onRetry: () => void;
}

export function PotdBanner({ problems, loading, error, solvedSlugs, onRetry }: PotdBannerProps) {
  return (
    <section className={cn(cardClass, "p-4 sm:p-5")}>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#18CCFC]/10 text-[#18CCFC]">
          <Sparkles className="size-3.5" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#18CCFC]">Problem of the day</p>
      </div>

      {error && !problems?.length ? (
        <ErrorNote message={error} onRetry={onRetry} />
      ) : loading && !problems ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(problems ?? []).map((p) => {
            const solved = solvedSlugs[p.platform].has(p.slug);
            return (
              <div
                key={p.platform}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 hover:bg-white/[0.05] transition-colors"
              >
                <PlatformIcon platform={p.platform} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white/90">{p.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
                    <DifficultyPill difficulty={p.difficulty} />
                    <span>{PLATFORM_META[p.platform].label}</span>
                    {p.tags.slice(0, 2).map((t) => (
                      <span key={t} className="hidden sm:inline">
                        · {t}
                      </span>
                    ))}
                    {p.acRate != null && <span className="hidden font-mono sm:inline">· {p.acRate}% acc</span>}
                  </div>
                </div>
                {solved ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> Solved
                  </span>
                ) : (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-white/90 transition-colors"
                  >
                    Solve <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
