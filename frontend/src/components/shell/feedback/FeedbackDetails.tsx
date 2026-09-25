import { CalendarDays, MessageCircle } from "lucide-react";
import type { FeedbackItem } from "@/app/types/feedback";
import FeedbackProgress from "./FeedbackProgress";
import FeedbackStatusBadge from "./FeedbackStatusBadge";

export default function FeedbackDetails({
  item,
}: {
  item: FeedbackItem;
}) {
  return (
    <section className="rounded-2xl border border-slate-800/80 bg-[#0d1016] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
            Feedback status
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-100">
            {item.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {item.description}
          </p>
        </div>
        <FeedbackStatusBadge status={item.status} />
      </div>

      <div className="my-7 border-t border-slate-800/80 pt-7">
        <FeedbackProgress status={item.status} />
      </div>

      <div className="flex flex-wrap gap-5 border-t border-slate-800/80 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <CalendarDays size={14} /> {item.date}
        </span>
        <span className="flex items-center gap-2">
          <MessageCircle size={14} /> {item.comments} comments
        </span>
      </div>
    </section>
  );
}
