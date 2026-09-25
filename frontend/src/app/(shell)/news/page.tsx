// src/app/(shell)/news/page.tsx — live news via the /api/news proxy route
// Features: latest→oldest default, sort tabs, category chips, debounced
// search, refresh button, skeletons + wake-up hint, error retry, empty state.
"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Toggle } from "@/components/shell/news/Toggle";
import { NewsCard } from "@/components/shell/news/NewsCard";
import { NewsDialog } from "@/components/shell/news/NewsDialog";
import { cn } from "@/lib/utils";

export interface NewsItem {
  id: string | number;
  heading: string;
  category: string;
  description: string | null; // null for sources without body text (e.g. Hacker News)
  url: string;
  source?: string;
  content?: string;
  date?: string;
  author?: string;
  image?: string;
  relevance_score?: number;
  impact_score?: number;
}

type SortKey = "date" | "relevance" | "impact";

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Latest" },
  { key: "relevance", label: "Top relevance" },
  { key: "impact", label: "Top impact" },
];

const LIMIT = 50;
const SEARCH_DEBOUNCE_MS = 400;
const WAKE_UP_HINT_MS = 5000;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-[11px] font-medium border transition-colors",
        active
          ? "bg-white/15 text-white border-white/15"
          : "bg-white/[0.04] text-white/45 border-white/[0.08] hover:text-white hover:bg-white/[0.08]"
      )}
    >
      {children}
    </button>
  );
}

export default function NewsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [hasSetDefault, setHasSetDefault] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [items, setItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [wakingUp, setWakingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [category, setCategory] = useState<string | null>(null);

  // Default view: list on mobile, grid on desktop (as before)
  useEffect(() => {
    if (!hasSetDefault) {
      const isMobile = window.innerWidth < 640;
      setView(isMobile ? "list" : "grid");
      setHasSetDefault(true);
    }
  }, [hasSetDefault]);

  // Debounce the search box so we don't fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const fetchNews = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      setWakingUp(false);
      const wakeTimer = setTimeout(() => setWakingUp(true), WAKE_UP_HINT_MS);

      try {
        const params = new URLSearchParams({ limit: String(LIMIT), sort });
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (category) params.set("category", category);

        const res = await fetch(`/api/news?${params.toString()}`, {
          cache: "no-store",
          signal,
        });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data: NewsItem[] = await res.json();
        setItems(Array.isArray(data) ? data : []);

        // Chips are learned from the UNFILTERED list so they stay stable
        // while a category/search filter is active.
        if (!debouncedQuery && !category) {
          setCategories((prev) => {
            const next = new Set(prev);
            for (const item of data) if (item.category) next.add(item.category);
            return Array.from(next).sort();
          });
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Couldn't load the news. The server may be waking up — try again in a moment.");
        }
      } finally {
        clearTimeout(wakeTimer);
        if (!signal?.aborted) {
          setLoading(false);
          setWakingUp(false);
        }
      }
    },
    [sort, debouncedQuery, category]
  );

  // Fetch on mount and whenever sort / search / category changes.
  // The AbortController cancels a stale request when filters change mid-flight.
  useEffect(() => {
    const controller = new AbortController();
    fetchNews(controller.signal);
    return () => controller.abort();
  }, [fetchNews]);

  return (
    <>
      <div className="flex flex-col gap-4 p-4 sm:p-0">
        {/* Header: title + refresh + view toggle */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Latest News</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNews()}
              disabled={loading}
              aria-label="Refresh news"
              className="flex items-center justify-center size-8 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </button>
            <Toggle view={view} onChange={setView} />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headlines & descriptions…"
            className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25 transition-colors"
          />
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 w-fit">
          {SORT_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                sort === key ? "bg-white/15 text-white" : "text-white/40 hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category chips (derived from live data) */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              All
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c}
                active={category === c}
                onClick={() => setCategory(category === c ? null : c)}
              >
                {c}
              </Chip>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-4">
            <div
              className={cn(
                "flex",
                view === "grid" ? "flex-wrap gap-4" : "flex-col w-full gap-3"
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "animate-pulse rounded-2xl border border-white/10 bg-white/5",
                    view === "grid"
                      ? "h-44 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
                      : "h-16 w-full"
                  )}
                />
              ))}
            </div>
            {wakingUp && (
              <p className="text-xs text-white/40 text-center">
                Waking up the news server — first load can take up to a minute…
              </p>
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl border border-white/10 bg-white/5">
            <p className="text-sm text-white/60">{error}</p>
            <button
              onClick={() => fetchNews()}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-white/50">
              No articles found
              {debouncedQuery ? ` for “${debouncedQuery}”` : ""}.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "flex",
              view === "grid"
                ? "flex-wrap gap-4"
                : "flex-col w-full border-t border-white/[0.08] mt-2"
            )}
          >
            {items.map((item) => (
              <NewsCard
                key={item.url} // url is the upsert key — unique per article; `id` isn't during legacy-data migration
                heading={item.heading}
                category={item.category}
                description={item.description || ""}
                url={item.url}
                view={view}
                source={item.source}
                date={item.date}
                onReadMore={() => {
                  setSelectedNews(item);
                  setIsDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <NewsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        news={selectedNews}
      />
    </>
  );
}
