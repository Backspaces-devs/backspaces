// src/app/(shell)/feedback/page.tsx — thin server wrapper; all state and logic
// live in components/shell/feedback/FeedbackPageContent.tsx.
import { FeedbackPageContent } from "@/components/shell/feedback/FeedbackPageContent";

export default function FeedbackPage() {
  return <FeedbackPageContent />;
}
