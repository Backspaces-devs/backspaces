// src/components/shell/feedback/FeedbackCard.tsx — one feedback entry in the list.
// Also the home of the shared types/constants so every sibling component
// imports from a single atom (avoids an extra types file + import cycles).
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackStatusBadge } from "./FeedbackStatusBadge";

/* ---------- shared types ---------- */

export const FEEDBACK_STAGES = ["submitted", "in-review", "planned", "implemented"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STAGES)[number];

export type FeedbackType =
  | "Feature Request"
  | "Bug Report"
  | "UI/UX Suggestion"
  | "General Inquiry";

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  category: string;
  status: FeedbackStatus;
  date: string;
  author?: string;
}

export const STAGE_META: Record<FeedbackStatus, { label: string; sublabel: string }> = {
  submitted: { label: "Submitted", sublabel: "" },
  "in-review": { label: "In Review", sublabel: "We're looking into it" },
  planned: { label: "Planned", sublabel: "Scheduled for future" },
  implemented: { label: "Implemented", sublabel: "Live on the platform" },
};

/* ---------- component ---------- */

interface FeedbackCardProps {
  item: FeedbackItem;
  selected?: boolean;
  onSelect?: () => void;
}

export function FeedbackCard({ item, selected = false, onSelect }: FeedbackCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-colors group",
        selected
          ? "border-white/25 bg-white/[0.05]"
          : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.04] hover:border-white/[0.14]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white/95 leading-snug">{item.title}</h3>
          <p className="mt-1 text-xs text-white/45 leading-relaxed">{item.description}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/[0.10] text-[10px] font-medium text-white/60">
              {item.type}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-medium text-white/40">
              {item.category}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <FeedbackStatusBadge status={item.status} />
          <span className="text-[10px] text-white/35">{item.date}</span>
        </div>

        <ChevronRight className="size-3.5 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>
    </button>
  );
}
