// src/components/shell/problemSolving/SheetTracker.tsx — Striver SDE, Blind 75
// and NeetCode 150 trackers. Progress is saved in MongoDB (browser fallback
// when the backend is offline), and problems you've recently solved on
// LeetCode get ticked automatically.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, RotateCcw } from "lucide-react";
import sheetsData from "@/data/dsa-sheets.json";
import type { NewRevisionTask, Sheet, SheetProblem, SheetProgress } from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { activityKey } from "./RecentActivity";
import { DIFFICULTY_COLOR, DifficultyPill, Panel } from "./ui";

const SHEETS = sheetsData as Sheet[];

interface SheetTrackerProps {
  progress: SheetProgress;
  mode: "loading" | "remote" | "local";
  onUpdate: (sheetId: string, ids: string[], done: boolean) => Promise<void>;
  recentAcceptedSlugs: string[] | undefined;
  queuedKeys: Set<string>;
  revisionAvailable: boolean;
  onAddToRevision: (task: NewRevisionTask) => Promise<void>;
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/25 hover:border-white/60"
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}

export function SheetTracker({
  progress,
  mode,
  onUpdate,
  recentAcceptedSlugs,
  queuedKeys,
  revisionAvailable,
  onAddToRevision,
}: SheetTrackerProps) {
  const [activeId, setActiveId] = useState(SHEETS[0].id);
  const [browsing, setBrowsing] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sheet = SHEETS.find((s) => s.id === activeId) ?? SHEETS[0];
  const done = useMemo(() => new Set(progress[sheet.id] ?? []), [progress, sheet.id]);
  const problems = useMemo(() => sheet.sections.flatMap((s) => s.problems), [sheet]);

  // ---- auto-tick sheet problems that appear in recent LeetCode accepted submissions
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current || mode === "loading" || !recentAcceptedSlugs?.length) return;
    synced.current = true;
    const solved = new Set(recentAcceptedSlugs);
    for (const s of SHEETS) {
      const have = new Set(progress[s.id] ?? []);
      const ids = s.sections
        .flatMap((sec) => sec.problems)
        .filter((p) => p.slug && solved.has(p.slug) && !have.has(p.id))
        .map((p) => p.id);
      if (ids.length) void onUpdate(s.id, ids, true);
    }
  }, [mode, recentAcceptedSlugs, progress, onUpdate]);

  const solvedCount = problems.filter((p) => done.has(p.id)).length;
  const pct = sheet.total ? Math.round((solvedCount / sheet.total) * 100) : 0;
  const byDiff = { Easy: 0, Medium: 0, Hard: 0, Other: 0 };
  for (const p of problems) if (done.has(p.id)) byDiff[p.difficulty ?? "Other"]++;
  const upNext = problems.filter((p) => !done.has(p.id)).slice(0, 3);
  const next = upNext[0];

  const toggle = (p: SheetProblem) => onUpdate(sheet.id, [p.id], !done.has(p.id));

  const row = (p: SheetProblem, index?: number) => {
    const key = activityKey(p.slug ? "leetcode" : "other", p.slug ?? p.id);
    const queued = queuedKeys.has(key);
    return (
      <div key={p.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
        <Checkbox checked={done.has(p.id)} onChange={() => toggle(p)} label={`Mark ${p.title} as solved`} />
        {index != null && <span className="w-5 shrink-0 font-mono text-[11px] text-white/30">{index}.</span>}
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] hover:text-white",
            done.has(p.id) ? "text-white/40 line-through decoration-white/20" : "text-white/85"
          )}
        >
          {p.title}
        </a>
        {p.platform === "Other" && <span className="text-[10px] text-white/30">search</span>}
        <DifficultyPill difficulty={p.difficulty} />
        {revisionAvailable && (
          <button
            type="button"
            disabled={queued}
            title={queued ? "In your revision queue" : "Add to revision queue"}
            aria-label={queued ? "In your revision queue" : "Add to revision queue"}
            onClick={() =>
              onAddToRevision({
                title: p.title,
                platform: p.slug ? "leetcode" : "other",
                slug: p.slug ?? p.id,
                url: p.url,
                difficulty: p.difficulty,
                topics: [sheet.sections.find((s) => s.problems.includes(p))?.title ?? sheet.name],
              })
            }
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md transition-all",
              queued ? "text-emerald-400" : "text-white/30 sm:opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white"
            )}
          >
            {queued ? <Check className="size-3" /> : <RotateCcw className="size-3" />}
          </button>
        )}
      </div>
    );
  };

  const offsets = sheet.sections.map((_, i) =>
    sheet.sections.slice(0, i).reduce((a, sec) => a + sec.problems.length, 0)
  );

  return (
    <Panel
      title="DSA sheets"
      subtitle={sheet.description}
      action={
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/50">
          {SHEETS.reduce((a, s) => a + (progress[s.id]?.length ?? 0), 0)} solved total
        </span>
      }
    >
      {/* tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-white/[0.08]">
        {SHEETS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setActiveId(s.id);
              setOpenSection(null);
            }}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors",
              s.id === sheet.id ? "border-[#18CCFC] text-white" : "border-transparent text-white/45 hover:text-white"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* progress */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex items-end justify-between gap-3">
          <p className="font-mono text-2xl font-bold text-white">
            {solvedCount}
            <span className="text-sm font-normal text-white/40"> / {sheet.total} solved</span>
          </p>
          <p className="font-mono text-xs text-[#18CCFC]">{pct}% complete</p>
        </div>
        <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          {(["Easy", "Medium", "Hard"] as const).map((d) => (
            <div
              key={d}
              title={`${d}: ${byDiff[d]}`}
              className="h-full transition-[width] duration-700"
              style={{ width: `${(byDiff[d] / sheet.total) * 100}%`, backgroundColor: DIFFICULTY_COLOR[d] }}
            />
          ))}
          <div
            className="h-full bg-white/40"
            style={{ width: `${(byDiff.Other / sheet.total) * 100}%` }}
            title={`Other: ${byDiff.Other}`}
          />
        </div>

        {!browsing && (
          <div className="mt-3 space-y-0.5">
            <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-white/35">Up next</p>
            {upNext.length ? upNext.map((p) => row(p)) : <p className="px-2 text-xs text-emerald-400">Sheet complete 🎉</p>}
          </div>
        )}
      </div>

      {/* full sheet */}
      {browsing && (
        <div className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
          {sheet.sections.map((sec, si) => {
            const start = offsets[si];
            const secDone = sec.problems.filter((p) => done.has(p.id)).length;
            const open = openSection === sec.title;
            return (
              <div key={sec.title} className="rounded-xl border border-white/[0.06]">
                <button
                  onClick={() => setOpenSection(open ? null : sec.title)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                >
                  <span className="text-xs font-medium text-white/80">{sec.title}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono text-[11px]",
                        secDone === sec.problems.length ? "text-emerald-400" : "text-white/40"
                      )}
                    >
                      {secDone}/{sec.problems.length}
                    </span>
                    <ChevronDown className={cn("size-3.5 text-white/40 transition-transform", open && "rotate-180")} />
                  </span>
                </button>
                {open && (
                  <div className="border-t border-white/[0.06] px-1 py-1">
                    {sec.problems.map((p, i) => row(p, start + i + 1))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {next && (
          <a
            href={next.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-white/90 transition-colors"
          >
            <span className="truncate">Continue: {next.title}</span>
            <ArrowUpRight className="size-3.5 shrink-0" />
          </a>
        )}
        <button
          onClick={() => setBrowsing((b) => !b)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors"
        >
          {browsing ? "Hide sheet" : "Browse sheet"}
          <ArrowRight className={cn("size-3.5 transition-transform", browsing && "rotate-90")} />
        </button>
      </div>

      <p className="mt-3 text-[10px] text-white/30">
        {mode === "local"
          ? "Saved in this browser — backend offline. Problems you solve on LeetCode are ticked automatically."
          : "Synced to your account. Problems you solve on LeetCode are ticked automatically."}
      </p>
    </Panel>
  );
}
