// src/components/shell/feedback/ThankYouState.tsx — confirmation view shown
// inside the FeedbackDialog right after a successful submit.
import { CheckCircle2 } from "lucide-react";

export function ThankYouState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-14 text-center">
      <span className="flex items-center justify-center size-11 rounded-full border border-white/15 bg-white/[0.05]">
        <CheckCircle2 className="size-5 text-white" />
      </span>
      <p className="text-sm font-medium text-white">Thanks for the feedback</p>
      <p className="text-xs text-white/40 -mt-1">It just joined the review queue.</p>
    </div>
  );
}
