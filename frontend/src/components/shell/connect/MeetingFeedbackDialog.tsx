"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Star,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  ListTodo,
  BookOpen,
  ExternalLink,
  Video,
  Award,
} from "lucide-react";
import type { PastMeeting } from "./PastMeetingsList";

interface MeetingFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: PastMeeting | null;
}

export function MeetingFeedbackDialog({
  open,
  onOpenChange,
  meeting,
}: MeetingFeedbackDialogProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [visible, setVisible] = useState(open);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

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

  const toggleAction = (actionText: string) => {
    setCompletedActions((prev) => ({
      ...prev,
      [actionText]: !prev[actionText],
    }));
  };

  if (!mounted || (!open && !visible) || !meeting) return null;

  const { feedback } = meeting;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Matte backdrop blur */}
      <div
        className={`absolute inset-0 bg-black/75 backdrop-blur-[14px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => onOpenChange(false)}
      />

      {/* Maximized Dialog Window */}
      <div
        className={`relative flex flex-col w-full bg-[#111114]/95 backdrop-blur-2xl border border-white/[0.1] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.8)] transition-all duration-200 ease-out
        h-[100dvh] rounded-none
        sm:h-auto sm:max-h-[88vh] sm:max-w-[720px] sm:w-[92vw] sm:rounded-[24px]
        ${open ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-6 sm:translate-y-3 sm:scale-[0.96]"}
        `}
      >
        <div className="absolute inset-0 rounded-none sm:rounded-[24px] bg-gradient-to-b from-blue-500/[0.08] via-transparent to-transparent pointer-events-none h-[35%]" />

        {/* Header */}
        <div className="relative shrink-0 p-6 sm:p-7 pb-4 border-b border-white/[0.08]">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/60 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="size-3" />
              1:1 Session Feedback
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/60">
              {meeting.type}
            </span>
            {feedback.overallScore && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <Star className="size-3 fill-amber-400" />
                Score: {feedback.overallScore} / 10
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pr-8">
            {meeting.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meeting.mentorAvatar}
                alt={meeting.mentorName}
                className="size-7 rounded-full object-cover border border-white/10"
              />
              <span className="text-white font-medium">{meeting.mentorName}</span>
              <span className="text-white/40">({meeting.mentorRole})</span>
            </div>

            <div className="flex items-center gap-3 text-white/50">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                {meeting.date}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {meeting.duration}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="relative flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 custom-scrollbar">
          {/* Mentor Summary Quote */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5 relative">
            <p className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-1.5 flex items-center gap-1.5">
              <Award className="size-3.5 text-blue-400" />
              Mentor Summary & Evaluation
            </p>
            <p className="text-sm sm:text-[15px] leading-relaxed text-white/85">
              &ldquo;{feedback.summary}&rdquo;
            </p>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
              <h3 className="text-xs uppercase font-semibold text-emerald-400 tracking-wider flex items-center gap-1.5 mb-3">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Key Strengths Observed
              </h3>
              <ul className="space-y-2">
                {feedback.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-white/80 leading-relaxed">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
              <h3 className="text-xs uppercase font-semibold text-amber-400 tracking-wider flex items-center gap-1.5 mb-3">
                <AlertTriangle className="size-4 text-amber-400" />
                Areas to Sharpen
              </h3>
              <ul className="space-y-2">
                {feedback.improvementAreas.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-white/80 leading-relaxed">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Items / Homework Checklist */}
          {feedback.actionItems && feedback.actionItems.length > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
              <h3 className="text-xs uppercase font-semibold text-blue-400 tracking-wider flex items-center gap-1.5 mb-3">
                <ListTodo className="size-4 text-blue-400" />
                Assigned Follow-Up Tasks & Practice Problems
              </h3>
              <div className="space-y-2">
                {feedback.actionItems.map((item, idx) => {
                  const isDone = completedActions[item];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleAction(item)}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                        isDone
                          ? "bg-emerald-500/10 border-emerald-500/30 line-through text-white/40"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] text-white/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(isDone)}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-white/20 text-blue-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm leading-relaxed flex-1">
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shared Links & Materials */}
          {feedback.sharedResources && feedback.sharedResources.length > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <h3 className="text-xs uppercase font-semibold text-white/60 tracking-wider flex items-center gap-1.5 mb-2.5">
                <BookOpen className="size-3.5 text-white/60" />
                Shared References & Notes
              </h3>
              <div className="flex flex-wrap gap-2">
                {feedback.sharedResources.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>{res.title}</span>
                    <ExternalLink className="size-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recording Link */}
          {meeting.recordingUrl && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-blue-400" />
                <span className="text-xs text-white/80 font-medium">
                  Zoom Cloud Recording Available (Password: backspaces)
                </span>
              </div>
              <a
                href={meeting.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Watch Recording
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-white/[0.08] flex items-center justify-between">
          <p className="text-xs text-white/40">
            Check off your action items before booking your next session.
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="px-5 py-2 rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold transition-colors"
          >
            Done
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