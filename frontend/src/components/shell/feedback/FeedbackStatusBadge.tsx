// src/components/shell/feedback/FeedbackStatusBadge.tsx — status badge.
// Monochrome base; semantic colors only as muted tints (status semantics).
import { cn } from "@/lib/utils";
import type { FeedbackStatus } from "./FeedbackCard";
import { STAGE_META } from "./FeedbackCard";

const PILL_STYLES: Record<FeedbackStatus, string> = {
  submitted: "bg-white/[0.06] border-white/[0.10] text-white/50",
  "in-review": "bg-amber-500/[0.08] border-amber-500/20 text-amber-400/90",
  planned: "bg-sky-500/[0.08] border-sky-500/20 text-sky-400/90",
  implemented: "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400/90",
};

export function FeedbackStatusBadge({ status, className }: { status: FeedbackStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium whitespace-nowrap",
        PILL_STYLES[status],
        className
      )}
    >
      {STAGE_META[status].label}
    </span>
  );
}
