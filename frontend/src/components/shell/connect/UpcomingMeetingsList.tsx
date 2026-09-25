"use client";

import React, { useState } from "react";
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface UpcomingMeeting {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorRole: string;
  mentorAvatar: string;
  title: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  status: "Confirmed" | "Pending" | string;
  platform: "Zoom" | string;
  zoomUrl: string;
  problemLink?: string;
  agenda?: string;
}

interface UpcomingMeetingsListProps {
  meetings: UpcomingMeeting[];
  onScheduleNew?: () => void;
  onCancelMeeting?: (meetingId: string) => void;
}

export function UpcomingMeetingsList({
  meetings,
  onScheduleNew,
  onCancelMeeting,
}: UpcomingMeetingsListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!meetings || meetings.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center flex flex-col items-center justify-center">
        <div className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
          <Calendar className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-white">No Upcoming Meetings</h3>
        <p className="text-xs text-white/50 max-w-sm mt-1 mb-4">
          Need help with a tricky DSA bug, code architecture, or mock interview? Schedule a 1:1 Zoom call with your mentor.
        </p>
        {onScheduleNew && (
          <button
            onClick={onScheduleNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
          >
            <Video className="size-3.5 fill-black" />
            Book a 1:1 Live Session
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {meetings.map((meeting) => (
        <div
          key={meeting.id}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 hover:bg-white/[0.07] transition-all flex flex-col gap-4"
        >
          {/* Top header row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase",
                  meeting.status === "Confirmed"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    meeting.status === "Confirmed" ? "bg-emerald-400" : "bg-amber-400 animate-ping"
                  )}
                />
                {meeting.status}
              </span>

              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/70">
                {meeting.type}
              </span>
            </div>

            {/* Date and time badge */}
            <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
              <Calendar className="size-3.5 text-blue-400" />
              <span>{meeting.date}</span>
              <span className="text-white/30">•</span>
              <Clock className="size-3.5 text-blue-400" />
              <span>{meeting.time}</span>
            </div>
          </div>

          {/* Center info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              {/* Mentor Avatar */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meeting.mentorAvatar}
                alt={meeting.mentorName}
                className="size-11 rounded-xl object-cover border border-white/15 shrink-0"
              />

              <div className="min-w-0">
                <h4 className="text-base font-semibold text-white leading-snug">
                  {meeting.title}
                </h4>
                <p className="text-xs text-white/60 mt-0.5">
                  with <span className="text-white font-medium">{meeting.mentorName}</span> ({meeting.mentorRole})
                </p>

                {meeting.agenda && (
                  <p className="text-xs text-white/50 mt-2 leading-relaxed bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.06]">
                    <span className="font-semibold text-white/70">Agenda: </span>
                    {meeting.agenda}
                  </p>
                )}

                {meeting.problemLink && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                    <Code2 className="size-3.5 text-emerald-400" />
                    <span className="text-white/40">Reference:</span>
                    <a
                      href={meeting.problemLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline inline-flex items-center gap-1 truncate max-w-xs"
                    >
                      {meeting.problemLink}
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons on right */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.08]">
              {/* Join Zoom Meeting Primary CTA */}
              <a
                href={meeting.zoomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] w-full sm:w-auto"
              >
                <Video className="size-4" />
                <span>Join Zoom Meeting</span>
                <ExternalLink className="size-3.5 opacity-70" />
              </a>

              <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
                <button
                  type="button"
                  onClick={() => handleCopyLink(meeting.id, meeting.zoomUrl)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  {copiedId === meeting.id ? (
                    <>
                      <Check className="size-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                {onCancelMeeting && (
                  <button
                    type="button"
                    onClick={() => onCancelMeeting(meeting.id)}
                    className="text-[11px] text-red-400/60 hover:text-red-400 px-2 py-1 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}