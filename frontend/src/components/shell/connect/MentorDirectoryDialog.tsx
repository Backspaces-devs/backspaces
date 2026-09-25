"use client";

import React, { useEffect, useState, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Star,
  ShieldCheck,
  Calendar,
  Video,
  ArrowRight,
} from "lucide-react";
import type { Mentor } from "./AssignedMentorCard";

export interface DatabaseMentor {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  bio: string;
  rating: number;
  totalSessions: number;
  availableSlots: string[];
  tags: string[];
  verified?: boolean;
}

interface MentorDirectoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentors: DatabaseMentor[];
  onSelectMentorToBook: (mentor: Mentor) => void;
}

const CATEGORY_TAGS = [
  "All",
  "DSA",
  "System Design",
  "AI & ML",
  "Open Source",
  "Backend",
  "AWS & Cloud",
];

export function MentorDirectoryDialog({
  open,
  onOpenChange,
  mentors,
  onSelectMentorToBook,
}: MentorDirectoryDialogProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [visible, setVisible] = useState(open);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

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

  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q));

      const matchesTag =
        selectedTag === "All" ||
        m.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()));

      return matchesSearch && matchesTag;
    });
  }, [mentors, searchQuery, selectedTag]);

  if (!mounted || (!open && !visible)) return null;

  const handleBook = (m: DatabaseMentor) => {
    onSelectMentorToBook({
      id: m.id,
      name: m.name,
      role: m.role,
      company: m.company,
      avatar: m.avatar,
      bio: m.bio,
      rating: m.rating,
      totalSessions: m.totalSessions,
      tags: m.tags,
      nextSlot: m.availableSlots[0],
    });
    onOpenChange(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-[14px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => onOpenChange(false)}
      />

      <div
        className={`relative flex flex-col w-full bg-[#111114]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl transition-all duration-200 ease-out
        h-[100dvh] rounded-none
        sm:h-auto sm:max-h-[88vh] sm:max-w-[780px] sm:w-[94vw] sm:rounded-[24px]
        ${open ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-6 sm:translate-y-3 sm:scale-[0.96]"}
        `}
      >
        <div className="absolute inset-0 rounded-none sm:rounded-[24px] bg-gradient-to-b from-emerald-500/[0.08] to-transparent pointer-events-none h-[25%]" />

        {/* Header */}
        <div className="relative shrink-0 p-6 sm:p-7 pb-4 border-b border-white/[0.08]">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/60 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Search Mentor Database
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Connect with verified engineers from top product companies for 1:1 Zoom doubt sessions and mock interviews.
          </p>

          <div className="mt-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by mentor name, company (Amazon, Google...), or skill..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            {CATEGORY_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${
                  selectedTag === tag
                    ? "bg-white text-black font-semibold border-white"
                    : "bg-white/[0.03] text-white/50 border-white/[0.08] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Mentors List Body */}
        <div className="relative flex-1 overflow-y-auto p-6 sm:p-7 space-y-4 custom-scrollbar">
          {filteredMentors.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">
              No mentors found matching &ldquo;{searchQuery}&rdquo;. Try another skill or company.
            </div>
          ) : (
            filteredMentors.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="size-13 rounded-xl object-cover border border-white/10"
                    />
                    {m.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-0.5 rounded-full">
                        <ShieldCheck className="size-3 stroke-[2.5]" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-semibold text-white">
                        {m.name}
                      </h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white/80 font-medium">
                        {m.company}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                        <Star className="size-3 fill-amber-400" />
                        {m.rating.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-white/60 mt-0.5">{m.role}</p>
                    <p className="text-xs text-white/40 mt-1 line-clamp-2 leading-relaxed">
                      {m.bio}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {m.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {m.availableSlots && m.availableSlots.length > 0 && (
                      <p className="text-[11px] text-emerald-400/80 mt-2 flex items-center gap-1">
                        <Calendar className="size-3" />
                        Slots: {m.availableSlots.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  <button
                    onClick={() => handleBook(m)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold shadow transition-all hover:scale-[1.02]"
                  >
                    <Video className="size-3.5 fill-black" />
                    <span>Schedule 1:1</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 p-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/40">
          <span>{filteredMentors.length} verified mentors available</span>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:text-white"
          >
            Close
          </button>
        </div>
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