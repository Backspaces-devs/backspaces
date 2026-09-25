// src/components/shell/feedback/FeedbackList.tsx — My/All tabs + the card list.
import { cn } from "@/lib/utils";
import type { FeedbackItem } from "./FeedbackCard";
import { FeedbackCard } from "./FeedbackCard";

export type FeedbackTab = "mine" | "all";

const TABS: { key: FeedbackTab; label: string }[] = [
  { key: "mine", label: "My Feedback" },
  { key: "all", label: "All Feedback" },
];

interface FeedbackListProps {
  tab: FeedbackTab;
  onTabChange: (tab: FeedbackTab) => void;
  items: FeedbackItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function FeedbackList({ tab, onTabChange, items, selectedId, onSelect }: FeedbackListProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-5 border-b border-white/[0.08]">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={cn(
              "relative pb-2.5 text-[13px] font-medium transition-colors",
              tab === key ? "text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            {label}
            {tab === key && <span className="absolute inset-x-0 -bottom-px h-px rounded-full bg-white/80" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <FeedbackCard
            key={item.id}
            item={item}
            selected={item.id === selectedId}
            onSelect={() => onSelect(item.id)}
          />
        ))}
        {items.length === 0 && (
          <p className="py-10 text-center text-xs text-white/40">Nothing here yet — be the first to share feedback.</p>
        )}
      </div>
    </div>
  );
}
