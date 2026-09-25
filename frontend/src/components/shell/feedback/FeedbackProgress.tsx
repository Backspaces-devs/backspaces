// src/components/shell/feedback/FeedbackProgress.tsx — compact 4-stage tracker.
// Monochrome: completed = white node + black check, current = white ring + dot,
// upcoming = faint ring. Follows the selected feedback card.
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedbackStatus } from "./FeedbackCard";
import { FEEDBACK_STAGES, STAGE_META } from "./FeedbackCard";

interface FeedbackProgressProps {
  status: FeedbackStatus;
  date: string;
}

const NODE_W = 80; // px — node column width; line insets align to node centers

export function FeedbackProgress({ status, date }: FeedbackProgressProps) {
  const current = FEEDBACK_STAGES.indexOf(status);
  const fraction = current / (FEEDBACK_STAGES.length - 1);

  return (
    <div className="relative flex justify-between max-w-2xl pt-0.5">
      {/* connecting line */}
      <div className="absolute top-[13px] h-px bg-white/10" style={{ left: NODE_W / 2, right: NODE_W / 2 }} />
      <div
        className="absolute top-[13px] h-px bg-white/50 transition-all duration-500"
        style={{ left: NODE_W / 2, width: `calc(${fraction} * (100% - ${NODE_W}px))` }}
      />

      {FEEDBACK_STAGES.map((stage, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        const sublabel = stage === "submitted" ? date : STAGE_META[stage].sublabel;

        return (
          <div key={stage} className="relative z-10 flex flex-col items-center gap-1.5 w-20 text-center">
            <span
              className={cn(
                "flex items-center justify-center size-5 rounded-full border-[1.5px] transition-colors bg-background",
                isDone && "border-white bg-white text-black",
                isCurrent && "border-white/70 text-white",
                !isDone && !isCurrent && "border-white/15 text-transparent"
              )}
            >
              {isDone ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <div>
              <p className={cn("text-[11px] font-medium leading-tight", i <= current ? "text-white/90" : "text-white/30")}>
                {STAGE_META[stage].label}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{sublabel}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
