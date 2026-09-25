// src/components/shell/news/NewsDialog.tsx - FINAL per your spec
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, Globe, Clock, ArrowRight } from "lucide-react";

interface NewsItem {
  id?: string | number;
  heading: string;
  category: string;
  description?: string | null; // can be missing from the API (e.g. Hacker News)
  url: string;
  source?: string; // source name like "The Verge", "GitHub Blog"
  sourceName?: string;
  content?: string; // full description if you have it
  date?: string;
  author?: string;
  image?: string;
  impact_score?: number;
}

interface NewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news: NewsItem | null;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getReadTime(text: string) {
  const words = text.split(" ").length;
  return Math.max(1, Math.ceil(words / 200));
}

export function NewsDialog({ open, onOpenChange, news }: NewsDialogProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onOpenChange]);

  if (!mounted || (!open && !visible) || !news) return null;

  const sourceName = news.source || news.sourceName || getDomain(news.url);
  const fullText = news.content || news.description || "";
  const readTime = fullText ? getReadTime(fullText) : null;

  return createPortal (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* BACKDROP - matte glassmorphism blur */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-[12px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => onOpenChange(false)}
      />

      {/* DIALOG CARD */}
      <div
        className={`relative flex flex-col w-full bg-[#121215]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.6)] transition-all duration-200 ease-out
        /* MOBILE: full screen */
        h-[100dvh] rounded-none
        /* DESKTOP: centered popup */
        sm:h-auto sm:max-h-[85vh] sm:max-w-[640px] sm:w-[90vw] sm:rounded-[24px]
        ${open ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-6 sm:translate-y-3 sm:scale-[0.96]"}
        `}
      >
        {/* subtle top highlight for glass effect */}
        <div className="absolute inset-0 rounded-none sm:rounded-[24px] bg-gradient-to-b from-white/[0.07] to-transparent pointer-events-none h-[40%]" />

        {/* ========== TOP SECTION ========== */}
        <div className="relative shrink-0 p-6 sm:p-7 pb-5">
          {/* Cross button - top right corner */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white/60 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>

          {/* Title */}
          <h2 className="pr-10 text-[20px] sm:text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-white">
            {news.heading}
          </h2>

          {/* Category - following the title */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium tracking-wide text-white/70">
              {news.category}
            </span>
            {readTime !== null && (
              <>
                <span className="hidden sm:block size-1 rounded-full bg-white/20" />
                <span className="inline-flex items-center gap-1.5 text-[12px] text-white/50">
                  <Clock className="size-3" />
                  {readTime} min read
                </span>
              </>
            )}
          </div>

          {/* Impact score - new row directly below category */}
          {typeof news.impact_score === "number" && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] font-medium text-white/60">
                <span className="text-white/40">Impact</span>
                <span className="text-white">{news.impact_score}</span>
                <span className="text-white/30">/100</span>
              </span>
            </div>
          )}

          {/* Source name - below category */}
          <div className="mt-3 flex items-center gap-1.5 text-[13px] text-white/60">
            <Globe className="size-3.5 text-white/40" />
            <span className="font-medium text-white/70">{sourceName}</span>
            {news.author && (
              <>
                <span className="text-white/20">•</span>
                <span>{news.author}</span>
              </>
            )}
          </div>

          {news.date && (
            <p className="mt-1.5 text-[12px] text-white/35">{news.date}</p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.08] mx-6 sm:mx-7" />

        {/* ========== SECOND SECTION ========== */}
        <div className="relative flex-1 overflow-y-auto p-6 sm:p-7 pt-5 sm:pt-6 custom-scrollbar">
          {news.image && (
            <div className="mb-5 rounded-xl overflow-hidden border border-white/10 bg-white/[0.03]">
              <img src={news.image} alt={news.heading} className="w-full h-auto max-h-[240px] object-cover" />
            </div>
          )}

          <div className="prose prose-invert max-w-none">
            {fullText ? (
              /* Show the fuller of content/description — never both, so
                 the full body isn't preceded by its own truncated teaser. */
              <p className="text-[14px] sm:text-[15px] leading-[1.7] text-white/75 whitespace-pre-wrap">
                {news.content && news.content.length >= (news.description || "").length
                  ? news.content
                  : news.description}
              </p>
            ) : (
              <p className="text-[14px] sm:text-[15px] leading-[1.7] text-white/40 italic">
                This source doesn’t include the article text — read the full story via the source link below.
              </p>
            )}
          </div>

          {/* Extra features: tags / info box */}
          <div className="mt-6 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-start gap-2.5">
            <div className="p-1.5 rounded-full bg-white/5 border border-white/5 mt-0.5">
              <Globe className="size-3 text-white/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/70">Source verified</p>
              <p className="text-[11px] text-white/40 mt-0.5 truncate">{getDomain(news.url)}</p>
            </div>
          </div>

          {/* View source link - after description */}
          <div className="mt-8 flex items-center justify-end">
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-[13px] sm:text-[14px] font-medium text-white hover:text-white/80 transition-colors"
            >
              <span className="relative">
                view source
                <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-white group-hover:w-full transition-all duration-300" />
              </span>
              <span className="flex items-center justify-center size-7 rounded-full bg-white text-black group-hover:bg-white/90 group-hover:gap-1 transition-all">
                <ArrowRight className="size-3.5 group-hover:translate-x-[1px] transition-transform" />
              </span>
            </a>
          </div>
        </div>

        {/* Mobile swipe indicator */}
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-white/20" />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>,
    document.body
  );
}