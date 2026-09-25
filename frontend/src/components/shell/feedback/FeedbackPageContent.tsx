// src/components/shell/feedback/FeedbackPageContent.tsx — client container for
// the Feedback page: owns state + mock data, assembles all feedback components.
// DATA: inline mock for now — replace `mockFeedback` with an API fetch later
// (same swap pattern as the news page).
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { FeedbackItem } from "./FeedbackCard";
import { FeedbackDetails } from "./FeedbackDetails";
import { FeedbackProgress } from "./FeedbackProgress";
import { FeedbackList, type FeedbackTab } from "./FeedbackList";
import { FeedbackDialog } from "./FeedbackDialog";

const mockFeedback: FeedbackItem[] = [
  {
    id: "fb-003",
    title: "Add dark mode for articles",
    description: "It would be great to have a dark mode for reading articles.",
    type: "Feature Request",
    category: "UI/UX",
    status: "implemented",
    date: "Sep 18, 2026",
  },
  {
    id: "fb-002",
    title: "Add filtering options in News section",
    description: "Allow filtering news by category (AI, Web Dev, etc.).",
    type: "Feature Request",
    category: "News",
    status: "in-review",
    date: "Sep 16, 2026",
  },
  {
    id: "fb-001",
    title: "Mobile responsive sidebar",
    description: "Sidebar overlaps content on smaller screens.",
    type: "Bug Report",
    category: "UI/UX",
    status: "planned",
    date: "Sep 12, 2026",
  },
];

export function FeedbackPageContent() {
  const [tab, setTab] = useState<FeedbackTab>("mine");
  const [selectedId, setSelectedId] = useState<string>(mockFeedback[0].id);
  const [formOpen, setFormOpen] = useState(false);

  // Later: "mine" filters by the signed-in user; for now both tabs show the mock list.
  const items = mockFeedback;
  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-0 w-full">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mt-1 text-[13px] text-white/40">
            Help us improve Backspaces. Share your thoughts, report issues or suggest new features.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 bg-white text-black hover:bg-white/85 text-[10px] sm:text-[12px] font-medium py-2 px-3.5 rounded-md transition-colors"
        >
          <Plus className="size-3.5" />
          Give Feedback
        </button>
      </div>

      {/* tracking section — follows the selected card */}
      {selected && (
        <div className="flex flex-col gap-3 w-full">
          <FeedbackDetails item={selected} />
          <FeedbackProgress status={selected.status} date={selected.date} />
        </div>
      )}

      {/* tabs + list */}
      <FeedbackList
        tab={tab}
        onTabChange={setTab}
        items={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <FeedbackDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
