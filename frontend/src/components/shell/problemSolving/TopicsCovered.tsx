// src/components/shell/problemSolving/TopicsCovered.tsx — solved count per
// topic (LeetCode tags). Bars are relative to your strongest topic, so the
// short ones are the topics worth practising next.
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TopicStat } from "@/lib/problemSolving/types";
import { cn } from "@/lib/utils";
import { EmptyNote, Panel, ProgressBar, Skeleton, TextButton } from "./ui";

const BAR_COLORS = ["#18CCFC", "#a78bfa", "#4ade80", "#FFA116", "#f87171", "#38bdf8"];
const COLLAPSED = 7;

export function TopicsCovered({ topics, loading }: { topics: TopicStat[] | undefined; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const list = topics ?? [];
  const max = list[0]?.solved ?? 1;
  const shown = expanded ? list : list.slice(0, COLLAPSED);

  return (
    <Panel
      title="Topics covered"
      subtitle={list.length ? `${list.length} topics · from LeetCode tags` : "From LeetCode tags"}
      action={
        list.length > COLLAPSED && (
          <TextButton onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Show less" : "All topics"}
            <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
          </TextButton>
        )
      }
    >
      {loading && !topics ? (
        <div className="space-y-4">
          {Array.from({ length: COLLAPSED }, (_, i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyNote>Set LEETCODE_USERNAME to see topic coverage.</EmptyNote>
      ) : (
        <div className={cn("space-y-3.5", expanded && "max-h-[340px] overflow-y-auto pr-1")}>
          {shown.map((t, i) => (
            <a
              key={t.slug}
              href={`https://leetcode.com/tag/${t.slug}/`}
              target="_blank"
              rel="noreferrer"
              className="group block"
            >
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-white/80 group-hover:text-white transition-colors">{t.name}</span>
                <span className="font-mono text-[11px] text-white/40">{t.solved} solved</span>
              </div>
              <ProgressBar value={(t.solved / max) * 100} color={BAR_COLORS[i % BAR_COLORS.length]} />
            </a>
          ))}
        </div>
      )}
    </Panel>
  );
}
