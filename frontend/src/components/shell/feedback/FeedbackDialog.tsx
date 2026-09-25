// src/components/shell/feedback/FeedbackDialog.tsx — "Give Feedback" modal.
// Pattern mirrors NewsDialog (portal, backdrop blur, Esc close, bottom-sheet on
// mobile). After submit it briefly shows <ThankYouState /> and closes itself.
// Submission is a stub (console.log) until feedback gets a real API.
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Send } from "lucide-react";
import type { FeedbackType } from "./FeedbackCard";
import { ThankYouState } from "./ThankYouState";

const TYPE_OPTIONS: FeedbackType[] = ["Feature Request", "Bug Report", "UI/UX Suggestion", "General Inquiry"];

const field =
  "w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-[13px] text-neutral-100 placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState<FeedbackType>("Feature Request");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onOpenChange]);

  // reset the form each time the dialog opens
  useEffect(() => {
    if (open) setSubmitted(false);
  }, [open]);

  if (!mounted || !open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: replace with POST /api/feedback when the backend route exists
    console.log({ type, title, description });
    setSubmitted(true);
    setTimeout(() => onOpenChange(false), 1600);
    setType("Feature Request");
    setTitle("");
    setDescription("");
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[12px] transition-opacity duration-200"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative flex flex-col w-full bg-[#121215]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl h-[100dvh] rounded-none sm:h-auto sm:max-h-[85vh] sm:max-w-[440px] sm:w-[90vw] sm:rounded-[20px]">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white/60 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="size-3.5" />
        </button>

        {submitted ? (
          <div className="flex flex-col min-h-[320px]">
            <ThankYouState />
          </div>
        ) : (
          <>
            <div className="shrink-0 p-5 sm:p-6 pb-3.5">
              <h2 className="text-lg font-semibold text-white pr-10">Give Feedback</h2>
              <p className="mt-0.5 text-xs text-white/40">Bugs, ideas, or feature requests — we read everything.</p>
            </div>

            <div className="h-px bg-white/[0.08] mx-5 sm:mx-6" />

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 pt-4 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-white/70">What kind of feedback is this?</label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FeedbackType)}
                    className={`${field} appearance-none cursor-pointer`}
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} className="bg-neutral-900">
                        {t}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[10px]">▼</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-white/70">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary — e.g. Add filtering in the News section"
                  required
                  maxLength={120}
                  className={field}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-white/70">Details</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your feedback in detail..."
                  rows={4}
                  required
                  className={`${field} resize-none`}
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-white/85 text-[13px] font-medium py-2 px-4 rounded-md transition-colors w-fit"
              >
                Submit Feedback
                <Send className="size-3" />
              </button>
            </form>
          </>
        )}

        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-white/20" />
      </div>
    </div>,
    document.body
  );
}
