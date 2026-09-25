// src/components/shell/feedback/FeedbackDetails.tsx — compact "now tracking"
// strip for the selected feedback item, rendered above the progress tracker.
import type { FeedbackItem } from "./FeedbackCard";
import { FeedbackStatusBadge } from "./FeedbackStatusBadge";

export function FeedbackDetails({ item }: { item: FeedbackItem }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0 text-xs">
      <span className="shrink-0 text-white/30 uppercase tracking-wider text-[10px] font-medium">
        Tracking
      </span>
      <span className="truncate text-white/70 font-medium">{item.title}</span>
      <span className="hidden sm:inline text-white/20">·</span>
      <span className="hidden sm:inline shrink-0 text-white/35">{item.date}</span>
      <FeedbackStatusBadge status={item.status} className="ml-auto sm:ml-1" />
    </div>
  );
}
