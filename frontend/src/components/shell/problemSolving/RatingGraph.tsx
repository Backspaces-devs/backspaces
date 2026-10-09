// src/components/shell/problemSolving/RatingGraph.tsx — contest rating over time
// for Codeforces, LeetCode and CodeChef on one chart, with a range picker and
// per-platform toggles.
"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlatformKey, RatingPoint, StatsResponse } from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { EmptyNote, PLATFORM_META, Panel, Skeleton } from "./ui";

type Range = "3M" | "6M" | "1Y" | "ALL";
const DAY = 86_400_000;
const RANGE_MS: Record<Range, number> = { "3M": 90 * DAY, "6M": 182 * DAY, "1Y": 365 * DAY, ALL: Infinity };

const SERIES: PlatformKey[] = ["codeforces", "leetcode", "codechef"];

type Row = { t: number } & Partial<Record<PlatformKey, number>> & { label?: string };

function buildRows(history: StatsResponse["ratingHistory"], enabled: PlatformKey[], range: Range, now: number) {
  const from = range === "ALL" ? -Infinity : now - RANGE_MS[range];
  const rows = new Map<number, Row>();
  const labels = new Map<number, string[]>();

  for (const p of enabled) {
    const points: RatingPoint[] = history[p] ?? [];
    const inRange = points.filter((pt) => pt.t >= from);
    // carry the last rating before the range so the line starts at the left edge
    const before = points.filter((pt) => pt.t < from).at(-1);
    if (before && Number.isFinite(from)) inRange.unshift({ ...before, t: from });
    for (const pt of inRange) {
      const row = rows.get(pt.t) ?? { t: pt.t };
      row[p] = pt.rating;
      rows.set(pt.t, row);
      if (pt.t !== from) labels.set(pt.t, [...(labels.get(pt.t) ?? []), `${PLATFORM_META[p].short}: ${pt.contest}`]);
    }
  }
  return [...rows.values()]
    .map((r) => ({ ...r, label: labels.get(r.t)?.join(" · ") }))
    .sort((a, b) => a.t - b.t);
}

/** First-of-month ticks between min and max, thinned to at most ~7 labels. */
function monthTicks(rows: Row[]): number[] {
  if (rows.length < 2) return rows.map((r) => r.t);
  const min = rows[0].t;
  const max = rows[rows.length - 1].t;
  const ticks: number[] = [];
  const d = new Date(min);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + 1);
  while (d.getTime() <= max) {
    ticks.push(d.getTime());
    d.setMonth(d.getMonth() + 1);
  }
  const step = Math.ceil(ticks.length / 7) || 1;
  return ticks.filter((_, i) => i % step === 0);
}

function fmtMonth(t: number) {
  return new Date(t).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function RatingGraph({ stats }: { stats: StatsResponse | undefined }) {
  const [range, setRange] = useState<Range>("6M");
  const [hidden, setHidden] = useState<PlatformKey[]>([]);

  const available = SERIES.filter((p) => (stats?.ratingHistory[p]?.length ?? 0) > 0);
  const enabled = available.filter((p) => !hidden.includes(p));

  // ranges are measured back from when the stats were fetched
  const now = stats ? Date.parse(stats.fetchedAt) : 0;
  const rows = stats ? buildRows(stats.ratingHistory, enabled, range, now) : [];

  const summary = available.map((p) => {
    const data = stats?.platforms[p].status === "ok" ? stats.platforms[p].data : null;
    const series = stats?.ratingHistory[p] ?? [];
    const from = range === "ALL" || !now ? -Infinity : now - RANGE_MS[range];
    const startPoint = series.filter((pt) => pt.t < from).at(-1) ?? series.find((pt) => pt.t >= from);
    const delta = data?.rating != null && startPoint ? data.rating - startPoint.rating : 0;
    return { p, rating: data?.rating, max: data?.maxRating, title: data?.title, delta };
  });

  return (
    <Panel
      className="lg:col-span-2"
      title="Unified rating graph"
      subtitle="Contest rating progression across platforms"
      action={
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {(Object.keys(RANGE_MS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                range === r ? "bg-white/15 text-white" : "text-white/45 hover:text-white"
              )}
            >
              {r === "ALL" ? "All" : r}
            </button>
          ))}
        </div>
      }
    >
      {!stats ? (
        <Skeleton className="h-[260px]" />
      ) : available.length === 0 ? (
        <EmptyNote>No rated contests yet on Codeforces, LeetCode or CodeChef.</EmptyNote>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {available.map((p) => {
              const on = !hidden.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => setHidden((h) => (on ? [...h, p] : h.filter((x) => x !== p)))}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    on ? "border-white/15 bg-white/[0.06] text-white/80" : "border-white/[0.06] text-white/30"
                  )}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: on ? PLATFORM_META[p].color : "rgba(255,255,255,0.2)" }}
                  />
                  {PLATFORM_META[p].label}
                  <span className="font-mono text-white/90">{summary.find((s) => s.p === p)?.rating ?? "—"}</span>
                </button>
              );
            })}
          </div>

          <div className="h-[240px] sm:h-[260px]">
            {rows.length === 0 ? (
              <EmptyNote>No contests in this range — try a longer one.</EmptyNote>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {enabled.map((p) => (
                      <linearGradient key={p} id={`rating-${p}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PLATFORM_META[p].color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={PLATFORM_META[p].color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    ticks={monthTicks(rows)}
                    tickFormatter={fmtMonth}
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                  />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} domain={["auto", "auto"]} width={44} />
                  <Tooltip
                    labelFormatter={(t, payload) => {
                      const row = payload?.[0]?.payload as Row | undefined;
                      const date = new Date(Number(t)).toLocaleDateString("en-IN", { dateStyle: "medium" });
                      return row?.label ? `${date} — ${row.label}` : date;
                    }}
                    formatter={(value, name) => [value, PLATFORM_META[name as PlatformKey]?.label ?? name]}
                    contentStyle={{
                      backgroundColor: "#111",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      maxWidth: 320,
                      whiteSpace: "normal",
                    }}
                  />
                  {enabled.map((p) => (
                    <Area
                      key={p}
                      type="monotone"
                      dataKey={p}
                      stroke={PLATFORM_META[p].color}
                      fill={`url(#rating-${p})`}
                      strokeWidth={2}
                      connectNulls
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] pt-3 text-[11px] text-white/45">
            {summary.map((s) => (
              <span key={s.p}>
                Max {PLATFORM_META[s.p].short}: <span className="font-mono text-white/80">{s.max ?? "—"}</span>
                {s.title && <span className="text-white/35"> ({s.title})</span>}
                {s.delta !== 0 && (
                  <span className={cn("ml-1 font-mono", s.delta > 0 ? "text-emerald-400" : "text-red-400")}>
                    {s.delta > 0 ? "+" : ""}
                    {s.delta}
                  </span>
                )}
              </span>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
