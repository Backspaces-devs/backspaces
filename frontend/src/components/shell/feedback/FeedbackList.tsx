import type { FeedbackItem } from "@/app/types/feedback";
import FeedbackCard from "./FeedbackCard";

export default function FeedbackList({
  items,
  selectedId,
  onSelect,
}: {
  items: FeedbackItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FeedbackCard
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          onClick={() => onSelect(item.id)}
        />
      ))}

      {!items.length && (
        <div className="rounded-2xl border border-dashed border-slate-800 py-16 text-center">
          <p className="text-sm text-slate-500">No feedback found.</p>
        </div>
      )}
    </div>
  );
}
