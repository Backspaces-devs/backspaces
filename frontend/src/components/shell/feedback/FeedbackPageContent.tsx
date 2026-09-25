"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import feedbackData from "@/app/MockDataFolder/feedback.json";
import type { FeedbackItem } from "@/app/types/feedback";
import FeedbackDialog from "./FeedbackDialog";
import FeedbackDetails from "./FeedbackDetails";
import FeedbackList from "./FeedbackList";

const items = feedbackData as FeedbackItem[];

export default function FeedbackPageContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedId, setSelectedId] = useState(items[1]?.id ?? items[0]?.id);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const belongs = tab === "all" || item.mine;
      const matchesQuery =
        !query ||
        `${item.title} ${item.description} ${item.category}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesStatus = status === "All" || item.status === status;

      return belongs && matchesQuery && matchesStatus;
    });
  }, [tab, query, status]);

  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  return (
    <>
      <main className="min-w-0 flex-1 bg-[#080a0f]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
                Feedback
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
                Share ideas, report issues, and help us improve Backspaces.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="h-10 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              + Give feedback
            </button>
          </header>

          <div className="mt-8">
            <FeedbackDetails item={selected} />
          </div>

          <section className="mt-8">
            <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setTab("mine")}
                  className={`border-b-2 pb-3 text-sm font-medium ${
                    tab === "mine"
                      ? "border-violet-500 text-violet-300"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  My Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setTab("all")}
                  className={`border-b-2 pb-3 text-sm font-medium ${
                    tab === "all"
                      ? "border-violet-500 text-violet-300"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  All Feedback
                </button>
              </div>

              <div className="flex w-full gap-2 sm:w-auto">
                <div className="relative min-w-0 flex-1 sm:w-64">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search feedback..."
                    className="h-10 w-full rounded-xl border border-slate-800 bg-[#0d1016] pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-500/50"
                  />
                </div>

                <div className="relative">
                  <SlidersHorizontal
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-10 appearance-none rounded-xl border border-slate-800 bg-[#0d1016] pl-9 pr-8 text-sm text-slate-400 outline-none focus:border-violet-500/50"
                  >
                    <option>All</option>
                    <option>In Review</option>
                    <option>Planned</option>
                    <option>In Progress</option>
                    <option>Implemented</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <FeedbackList
                items={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </section>
        </div>
      </main>

      <FeedbackDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
