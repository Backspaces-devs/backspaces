"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, Send, MessageSquare, Check, Code2 } from "lucide-react";
import type { Mentor } from "./AssignedMentorCard";

interface QuickDoubtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor: Mentor | null;
  onSubmitDoubt: (doubt: { mentorName: string; question: string; codeLink?: string }) => void;
}

export function QuickDoubtDialog({
  open,
  onOpenChange,
  mentor,
  onSubmitDoubt,
}: QuickDoubtDialogProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [visible, setVisible] = useState(open);
  const [question, setQuestion] = useState("");
  const [codeLink, setCodeLink] = useState("");
  const [sent, setSent] = useState(false);

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
    if (!question.trim()) return;

    onSubmitDoubt({
      mentorName: mentor.name,
      question: question.trim(),
      codeLink: codeLink.trim() || undefined,
    });

    setSent(true);
    setTimeout(() => {
      setSent(false);
      setQuestion("");
      setCodeLink("");
      onOpenChange(false);
    }, 1500);
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
        h-auto max-h-[85vh] sm:max-w-[540px] sm:w-[90vw] rounded-t-[24px] sm:rounded-[24px]
        ${open ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-6 sm:translate-y-3 sm:scale-[0.96]"}
        `}
      >
        <div className="relative shrink-0 p-6 pb-4 border-b border-white/[0.08]">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/60 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
              <MessageSquare className="size-3" />
              Async Doubt Thread
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Ask Doubt to {mentor.name}
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Avg reply time: {mentor.avgResponseTime || "< 2 hours"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {sent ? (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="size-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                <Check className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Doubt Sent to {mentor.name}!</h3>
              <p className="text-xs text-white/50 mt-1">
                You will receive a notification and response in your inbox.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Describe Your Doubt / Problem
                </label>
                <textarea
                  rows={4}
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Explain what concept or bug you're stuck on. Provide context on what you expected vs what occurred..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Code / Problem Link (Optional)
                </label>
                <div className="relative">
                  <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                  <input
                    type="url"
                    value={codeLink}
                    onChange={(e) => setCodeLink(e.target.value)}
                    placeholder="https://leetcode.com/... or GitHub link"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none transition-colors"
                  />
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
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold shadow-lg transition-all"
                >
                  <Send className="size-3.5 fill-black" />
                  <span>Send Doubt</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}