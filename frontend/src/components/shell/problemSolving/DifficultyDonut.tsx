// src/components/shell/problemSolving/DifficultyDonut.tsx — Easy / Medium / Hard
// split. "All" sums every platform. Codeforces problems are bucketed by rating
// (≤1200 Easy, ≤1800 Medium, above Hard); CodeChef by its star bands (<1400 Easy,
// <2000 Medium, 2000+ Hard), falling back to the practice category for unrated
// problems. CodeChef levels are classified on the server and fill in over a few
// seconds the first time.
"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Difficulty, DifficultySplit, PlatformKey, StatsResponse } from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { DIFFICULTY_COLOR, EmptyNote, PLATFORM_META, Panel, ProgressBar, Skeleton, formatNumber } from "./ui";

type Source = "all" | PlatformKey;

export function DifficultyDonut({ stats }: { stats: StatsResponse | undefined }) {
  const [source, setSource] = useState<Source>("all");

  const sources: Source[] = [
    "all",
    ...(["leetcode", "codeforces", "codechef", "gfg"] as PlatformKey[]).filter(
      (p) => stats?.platforms[p].status === "ok" && stats.platforms[p].data.difficulty
    ),
  ];

  let split: DifficultySplit | null = null;
  if (stats) {
    if (source === "all") split = stats.totals.difficulty;
    else {
      const st = stats.platforms[source];
      split = st.status === "ok" ? st.data.difficulty : null;
    }
  }

  const rows: { name: Difficulty; value: number }[] = split
    ? [
        { name: "Easy", value: split.easy },
        { name: "Medium", value: split.medium },
        { name: "Hard", value: split.hard },
      ]
    : [];
  const total = rows.reduce((a, r) => a + r.value, 0);
  // zero-value slices are left out of the chart: recharts keeps a stale arc for a
  // slice whose value drops to 0 when the data changes (the bars below still list them)
  const pieRows = rows.filter((r) => r.value > 0);
  const pending = split?.pending ?? 0;
  const unrated = split?.unrated ?? 0;
  // "All" subtitle: "All platforms" when every connected platform is included, else the short list
  const connected = (["leetcode", "codeforces", "codechef", "gfg"] as PlatformKey[]).filter(
    (p) => stats?.platforms[p].status === "ok"
  );
  const included = connected.filter((p) => stats?.platforms[p].status === "ok" && stats.platforms[p].data.difficulty);
  const allSubtitle =
    included.length === 0
      ? "All platforms"
      : included.length === connected.length && included.length > 1
        ? "All platforms"
        : included.map((p) => PLATFORM_META[p].short).join(" · ");

  return (
    <Panel
      title="Question levels"
      subtitle={source === "all" ? allSubtitle : PLATFORM_META[source].label}
      action={
        sources.length > 2 && (
          <div className="flex items-center gap-1">
            {sources.map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={cn(
                  "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                  source === s ? "bg-white/15 text-white" : "text-white/40 hover:text-white"
                )}
              >
                {s === "all" ? "ALL" : PLATFORM_META[s].short}
              </button>
            ))}
          </div>
        )
      }
    >
      {!stats ? (
        <Skeleton className="h-[260px]" />
      ) : total === 0 && pending > 0 ? (
        <EmptyNote>Classifying {pending} CodeChef problems…</EmptyNote>
      ) : total === 0 ? (
        <EmptyNote>No solved problems with difficulty data yet.</EmptyNote>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <div className="relative h-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart key={source}>
                <Pie
                  data={pieRows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="70%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieRows.map((r) => (
                    <Cell key={r.name} fill={DIFFICULTY_COLOR[r.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-mono text-2xl font-bold text-white">{formatNumber(total)}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">solved</p>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((r) => {
              const pct = total ? (r.value / total) * 100 : 0;
              return (
                <div key={r.name}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-white/70">
                      <span className="size-2 rounded-full" style={{ backgroundColor: DIFFICULTY_COLOR[r.name] }} />
                      {r.name}
                    </span>
                    <span className="font-mono text-white/80">
                      {formatNumber(r.value)} <span className="text-white/35">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <ProgressBar value={pct} color={DIFFICULTY_COLOR[r.name]} />
                </div>
              );
            })}
          </div>

          {(pending > 0 || unrated > 0) && (
            <p className="mt-auto text-[11px] leading-relaxed text-white/35">
              {pending > 0 && <>Classifying {pending} more CodeChef problems… </>}
              {unrated > 0 && (
                <>
                  {unrated} CodeChef {unrated === 1 ? "problem isn’t" : "problems aren’t"} counted — CodeChef doesn’t list
                  practice-path problems or give every problem a difficulty.
                </>
              )}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
