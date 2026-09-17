// src/app/(shell)/news/page.tsx - FINAL INTEGRATION
"use client";

import { useState, useEffect } from "react";
import { Toggle } from "@/components/shell/news/Toggle";
import { NewsCard } from "@/components/shell/news/NewsCard";
import { NewsDialog } from "@/components/shell/news/NewsDialog";
import { cn } from "@/lib/utils";
import newsData from "@/app/MockDataFolder/news.json";

interface NewsItem {
  id: string | number;
  heading: string;
  category: string;
  description: string;
  url: string;
  source?: string;
  content?: string;
  date?: string;
  author?: string;
}

export default function NewsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [hasSetDefault, setHasSetDefault] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!hasSetDefault) {
      const isMobile = window.innerWidth < 640;
      setView(isMobile ? "list" : "grid");
      setHasSetDefault(true);
    }
  }, [hasSetDefault]);

  return (
    <>
      <div className="flex flex-col gap-4 p-4 sm:p-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Latest News</h1>
          <Toggle view={view} onChange={setView} />
        </div>

        <div
          className={cn(
            "flex",
            view === "grid"
              ? "flex-wrap gap-4"
              : "flex-col w-full border-t border-white/[0.08] mt-2"
          )}
        >
          {newsData.news.map((item) => (
            <NewsCard
              key={item.id}
              heading={item.heading}
              category={item.category}
              description={item.description}
              url={item.url}
              view={view}
              source={(item as any).source}
              onReadMore={() => {
                setSelectedNews(item as NewsItem);
                setIsDialogOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      <NewsDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} news={selectedNews} />
    </>
  );
}
