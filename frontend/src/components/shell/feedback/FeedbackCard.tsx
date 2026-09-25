import { ChevronRight, MessageCircle, ThumbsUp } from "lucide-react";
import type { FeedbackItem } from "@/app/types/feedback";
import FeedbackStatusBadge from "./FeedbackStatusBadge";

export default function FeedbackCard({
  item,
  selected,
  onClick,
}: {
  item: FeedbackItem;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full rounded-2xl border p-5 text-left transition-all",
        "bg-[#0d1016] hover:-translate-y-[1px] hover:border-slate-700 hover:bg-[#10141c]",
        selected
          ? "border-violet-500/40 ring-1 ring-violet-500/10"
          : "border-slate-800/80",
      ].join(" ")}
    >
      <div className="flex gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-400">
          <ThumbsUp size={15} />
          <span className="text-sm font-semibold text-slate-200">
            {item.votes}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-100">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            </div>
            <FeedbackStatusBadge status={item.status} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-violet-500/30 bg-violet-500/5 px-2.5 py-1 text-violet-300">
              {item.type}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-400">
              {item.category}
            </span>
            <span className="ml-auto flex items-center gap-1 text-slate-500">
              <MessageCircle size={14} />
              {item.comments}
            </span>
            <span className="text-slate-600">{item.date}</span>
            <ChevronRight
              size={17}
              className="text-slate-600 transition-transform group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>
    </button>
  );
}
