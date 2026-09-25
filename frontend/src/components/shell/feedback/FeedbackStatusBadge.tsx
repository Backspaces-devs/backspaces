import type { FeedbackStatus } from "@/app/types/feedback";

const statusStyles: Record<FeedbackStatus, string> = {
  "Implemented": "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  "In Progress": "border-blue-500/20 bg-blue-500/10 text-blue-400",
  "In Review": "border-violet-500/20 bg-violet-500/10 text-violet-400",
  "Planned": "border-amber-500/20 bg-amber-500/10 text-amber-400",
};

export default function FeedbackStatusBadge({
  status,
}: {
  status: FeedbackStatus;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusStyles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
