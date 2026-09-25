"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Clock,
  Video,
  Link as LinkIcon,
} from "lucide-react";
import type { Mentor } from "./AssignedMentorCard";
import type { UpcomingMeeting } from "./UpcomingMeetingsList";

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor: Mentor | null;
  onConfirmSchedule: (meeting: UpcomingMeeting) => void;
}

const SESSION_TYPES = [
  {
    id: "Live Doubt Clearing",
    title: "Live Doubt Clearing",
    desc: "Unstick code, tricky algorithms, or edge cases",
    duration: "45 mins",
  },
  {
    id: "1:1 Code Review",
    title: "Project / Code Review",
    desc: "Architecture, clean code, and PR feedback",
    duration: "45 mins",
  },
  {
    id: "Mock Technical Interview",
    title: "Mock Interview",
    desc: "Simulate top tech company interview loops",
    duration: "60 mins",
  },
  {
    id: "Career & Resume Advice",
    title: "Career & Roadmap",
    desc: "Internship strategies & resume review",
    duration: "30 mins",
  },
];

const AVAILABLE_DAYS = [
  { label: "Tomorrow", dateStr: "Tomorrow, Sep 26, 2026" },
  { label: "Sunday", dateStr: "Sunday, Sep 27, 2026" },
  { label: "Monday", dateStr: "Monday, Sep 28, 2026" },
];

const TIME_SLOTS = [
  "4:30 PM – 5:15 PM IST",
  "6:00 PM – 6:45 PM IST",
  "7:30 PM – 8:15 PM IST",
  "9:00 PM – 9:45 PM IST",
];

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  mentor,
  onConfirmSchedule,
}: ScheduleMeetingDialogProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [visible, setVisible] = useState(open);

  const [selectedType, setSelectedType] = useState("Live Doubt Clearing");
  const [selectedDay, setSelectedDay] = useState(AVAILABLE_DAYS[0]);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [topic, setTopic] = useState("");
  const [problemUrl, setProblemUrl] = useState("");
  const [agenda, setAgenda] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (!mounted || (!open && !visible) || !mentor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const randomMeetingId = Math.floor(10000000000 + Math.random() * 90000000000);
    const zoomMeetingUrl = `https://zoom.us/j/${randomMeetingId}?pwd=backspaces_${Math.random().toString(36).substring(2, 8)}`;

    const newMeeting: UpcomingMeeting = {
      id: `meet-${Date.now()}`,
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorRole: `${mentor.role} @ ${mentor.company}`,
      mentorAvatar: mentor.avatar,
      title: topic.trim() || `${selectedType} with ${mentor.name}`,
      type: selectedType,
      date: selectedDay.dateStr,
      time: selectedSlot,
      duration: SESSION_TYPES.find((t) => t.id === selectedType)?.duration || "45 mins",
      status: "Confirmed",
      platform: "Zoom",
      zoomUrl: zoomMeetingUrl,
      problemLink: problemUrl.trim() || undefined,
      agenda: agenda.trim() || "Mutual doubt clearing and real-time guidance.",
    };

    setTimeout(() => {
      onConfirmSchedule(newMeeting);
      setIsSubmitting(false);
      onOpenChange(false);
      setTopic("");
      setProblemUrl("");
      setAgenda("");
    }, 400);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/75 backdrop-blur-[14px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => onOpenChange(false)}
      />

      <div
        className={`relative flex flex-col w-full bg-[#111114]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl transition-all duration-200 ease-out
        h-[100dvh] rounded-none
        sm:h-auto sm:max-h-[90vh] sm:max-w-[620px] sm:w-[92vw] sm:rounded-[24px]
        ${open ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-6 sm:translate-y-3 sm:scale-[0.96]"}
        `}
      >
        <div className="absolute inset-0 rounded-none sm:rounded-[24px] bg-gradient-to-b from-blue-600/[0.1] to-transparent pointer-events-none h-[30%]" />

        {/* Header */}
        <div className="relative shrink-0 p-6 sm:p-7 pb-4 border-b border-white/[0.08]">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/60 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
              <Video className="size-3" />
              Zoom Live 1:1 Booking
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Schedule Session with {mentor.name}
          </h2>
          <p className="text-xs text-white/50 mt-1">
            {mentor.role} @ {mentor.company}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="relative flex-1 overflow-y-auto p-6 sm:p-7 space-y-5 custom-scrollbar">
          {/* Step 1: Session Format */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
              1. Select Session Focus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SESSION_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedType === t.id
                      ? "bg-blue-600/15 border-blue-500 text-white shadow-sm"
                      : "bg-white/[0.02] border-white/[0.08] text-white/60 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>{t.title}</span>
                    <span className="text-[10px] text-white/40">{t.duration}</span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-1 leading-snug">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Date & Slot */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
              2. Mutual Availability Slot
            </label>
            <div className="flex gap-2 mb-2.5">
              {AVAILABLE_DAYS.map((d) => (
                <button
                  type="button"
                  key={d.label}
                  onClick={() => setSelectedDay(d)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border text-center transition-colors ${
                    selectedDay.label === d.label
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-colors flex items-center justify-center gap-1.5 ${
                    selectedSlot === slot
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold"
                      : "bg-white/[0.02] border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Clock className="size-3" />
                  <span>{slot}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Doubt Details & Code Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
              3. Doubt / Topic Details
            </label>

            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Graph BFS / Tree DP doubt, or Portfolio review"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/30" />
                  <input
                    type="url"
                    value={problemUrl}
                    onChange={(e) => setProblemUrl(e.target.value)}
                    placeholder="Problem URL or GitHub repository / PR link"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="What have you tried so far? What specific test case or roadblock are you facing?"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Zoom notice */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-white/70 flex items-start gap-2.5">
            <Video className="size-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-white">Zoom Meeting Auto-Generation</p>
              <p className="text-[11px] text-white/50 mt-0.5">
                A verified Zoom meeting link and calendar invite will be generated instantly for both you and your mentor.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-full text-xs text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/90 font-semibold text-xs transition-all shadow-lg shadow-white/10 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Scheduling Zoom Room...</span>
              ) : (
                <>
                  <Video className="size-3.5 fill-black" />
                  <span>Confirm Zoom Session</span>
                </>
              )}
            </button>
          </div>
        </form>
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