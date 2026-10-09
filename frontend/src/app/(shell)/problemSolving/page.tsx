// src/app/(shell)/problemSolving/page.tsx — thin server wrapper; all state and
// logic live in components/shell/problemSolving/ProblemSolvingContent.tsx.
import type { Metadata } from "next";
import { ProblemSolvingContent } from "@/components/shell/problemSolving/ProblemSolvingContent";

export const metadata: Metadata = {
  title: "Problem Solving · Backspaces",
  description: "Your LeetCode, Codeforces, CodeChef and GFG progress in one place.",
};

export default function ProblemSolvingPage() {
  return <ProblemSolvingContent />;
}
