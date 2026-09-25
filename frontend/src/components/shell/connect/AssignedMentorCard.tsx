"use client";

import React from "react";
import {
  Video,
  Star,
  Clock,
  ShieldCheck,
  Calendar,
  Sparkles,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  bio: string;
  rating: number;
  totalSessions: number;
  avgResponseTime?: string;
  assignedSince?: string;
  status?: string;
  tags: string[];
  zoomPersonalLink?: string;
  nextSlot?: string;
}

interface AssignedMentorCardProps {
  mentor: Mentor;
  isPrimary?: boolean;
  onScheduleMeeting: (mentor: Mentor) => void;
  onQuickDoubt?: (mentor: Mentor) => void;
}

export function AssignedMentorCard({
  mentor,
  isPrimary = true,
  onScheduleMeeting,
  onQuickDoubt,
}: AssignedMentorCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border backdrop-blur-md p-5 sm:p-6 transition-all duration-300",
        isPrimary
          ? "border-[#4B6A9B]/30 bg-gradient-to-b from-[#4B6A9B]/[0.07] via-white/[0.04] to-white/[0.02] shadow-[0_0_30px_-10px_rgba(75,106,155,0.15)]"
          : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
      )}
    >
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-wide text-indigo-300 border border-indigo-500/30"
            )}
          >
            {isPrimary ? "Assigned Mentor" : "Active Session Mentor"}
          </span>

          {/* {mentor.status && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] text-white/70 border border-white/10">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {mentor.status}
            </span>
          )} */}
        </div>
      </div>

      {/* Main Mentor Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mentor.avatar}
            alt={mentor.name}
            className="size-16 sm:size-20 rounded-2xl object-cover border-2 border-white/15 shadow-lg"
          />

        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {mentor.name}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-white/80 font-medium">
              {mentor.company}
            </span>
          </div>

          <p className="text-sm font-medium text-white/70 mt-0.5">
            {mentor.role}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/60">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
              {mentor.rating.toFixed(1)}
              <span className="text-white/40 font-normal">
                {mentor.totalSessions} sessions
              </span>
            </span>

            {mentor.nextSlot && (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <Calendar className="size-3.5" />
                Next Slot: {mentor.nextSlot}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expertise Tags */}
      <div className="mt-4 pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-white/40 font-medium mr-1">
          Specialties:
        </span>
        {mentor.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] py-0.5 rounded-full text-white/75 transition-colors"
          >
            {tag + " ,"}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {onQuickDoubt && (
            <button
              type="button"
              onClick={() => onQuickDoubt(mentor)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors"
            >
              <MessageSquare className="size-3.5" />
              Ask Doubt
            </button>
          )}

          <button
            type="button"
            onClick={() => onScheduleMeeting(mentor)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold shadow-lg shadow-white/10 transition-all hover:scale-[1.02]"
          >
            <Video className="size-3.5 fill-black" />
            <span>Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
}