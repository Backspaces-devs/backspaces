"use client";

import React from "react";
import {
  FileText,
  Star,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from "lucide-react";

export interface PastMeetingFeedback {
  overallScore?: number;
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  actionItems: string[];
  sharedResources?: { title: string; url: string }[];
}

export interface PastMeeting {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorRole: string;
  mentorAvatar: string;
  title: string;
  type: string;
  date: string;
  duration: string;
  platform: string;
  recordingUrl?: string;
  feedback: PastMeetingFeedback;
}

interface PastMeetingsListProps {
  meetings: PastMeeting[];
  onOpenFeedback: (meeting: PastMeeting) => void;
}

export function PastMeetingsList({
  meetings,
  onOpenFeedback,
}: PastMeetingsListProps) {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center flex flex-col items-center justify-center">
        <div className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
          <FileText className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-white">No Past Sessions Yet</h3>
        <p className="text-xs text-white/50 max-w-sm mt-1">
          Once you complete a 1:1 Zoom session, your mentor&apos;s code review, strengths, improvement areas, and recommended problems will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {meetings.map((meeting) => (
        <div
          key={meeting.id}
          onClick={() => onOpenFeedback(meeting)}
          className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between gap-4"
        >
          {/* Top meta */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 className="size-3" />
                Completed
              </span>

              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <Calendar className="size-3" />
                <span>{meeting.date}</span>
                <span>•</span>
                <span>{meeting.duration}</span>
              </div>
            </div>

            <h4 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
              {meeting.title}
            </h4>

            {/* Mentor info */}
            <div className="flex items-center gap-2 mt-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meeting.mentorAvatar}
                alt={meeting.mentorName}
                className="size-6 rounded-full object-cover border border-white/10"
              />
              <span className="text-xs text-white/70 font-medium">
                {meeting.mentorName}
              </span>
              <span className="text-xs text-white/30">•</span>
              <span className="text-xs text-white/40 truncate">
                {meeting.mentorRole}
              </span>
            </div>

            {/* Excerpt of feedback */}
            <p className="text-xs text-white/60 mt-3 line-clamp-2 leading-relaxed bg-white/[0.02] border border-white/[0.05] p-2.5 rounded-xl">
              &ldquo;{meeting.feedback.summary}&rdquo;
            </p>
          </div>

          {/* Bottom row */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            {meeting.feedback.overallScore ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Star className="size-3.5 fill-amber-400" />
                Score: {meeting.feedback.overallScore}/10
              </span>
            ) : (
              <span className="text-xs text-white/40">Feedback recorded</span>
            )}

            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-blue-300 transition-colors"
            >
              <span>View Full Feedback</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}