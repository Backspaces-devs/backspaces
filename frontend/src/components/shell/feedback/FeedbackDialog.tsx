"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import ThankYouState from "./ThankYouState";

type FeedbackDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmitted?: (feedback: {
    title: string;
    description: string;
    type: string;
    category: string;
  }) => void;
};

const initialForm = {
  title: "",
  description: "",
  type: "Feature Request",
  category: "General",
};

export default function FeedbackDialog({
  open,
  onClose,
  onSubmitted,
}: FeedbackDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    setSubmitted(false);
    setForm(initialForm);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!submitted) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, 1900);

    return () => window.clearTimeout(timer);
  }, [submitted, onClose]);

  if (!open) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmitted?.(form);
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-[#0c0f15] shadow-2xl shadow-black/50 animate-[dialog-in_180ms_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
      >
        {submitted ? (
          <ThankYouState />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="feedback-dialog-title"
                  className="font-semibold text-slate-100"
                >
                  Give feedback
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Tell us what we can improve.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-300">
                  What should we improve? <span className="text-violet-400">*</span>
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Add filters to News"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-500/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-300">
                  Description <span className="text-violet-400">*</span>
                </label>
                <textarea
                  required
                  minLength={10}
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the issue, idea, or improvement..."
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-500/60"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-300">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-violet-500/60"
                  >
                    <option>Feature Request</option>
                    <option>Bug Report</option>
                    <option>Improvement</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-300">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-violet-500/60"
                  >
                    <option>General</option>
                    <option>UI/UX</option>
                    <option>News</option>
                    <option>Article</option>
                    <option>Problem Solving</option>
                    <option>Open Source</option>
                    <option>Academics</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white transition hover:bg-violet-500 active:scale-[.99]"
              >
                <Check size={17} />
                Submit feedback
              </button>
            </form>
          </>
        )}

        <style jsx>{`
          @keyframes dialog-in {
            from { opacity: 0; transform: translateY(8px) scale(.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
