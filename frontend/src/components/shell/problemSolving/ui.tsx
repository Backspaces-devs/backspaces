// src/components/shell/problemSolving/ui.tsx — small building blocks shared by
// every Problem Solving card. Styling follows the existing shell pages
// (white/5 glass cards, white/10 borders, Geist + Geist Mono).
"use client";

import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Difficulty, PlatformKey, VerdictKind } from "@/lib/problemSolving/types";

// ---------------------------------------------------------------- constants

export const PLATFORM_META: Record<
  PlatformKey | "other",
  { label: string; short: string; color: string; icon: string | null }
> = {
  leetcode: { label: "LeetCode", short: "LC", color: "#FFA116", icon: "/icons/leetcode.svg" },
  codeforces: { label: "Codeforces", short: "CF", color: "#18CCFC", icon: "/icons/codeforces.svg" },
  codechef: { label: "CodeChef", short: "CC", color: "#a78bfa", icon: "/icons/codechef.svg" },
  gfg: { label: "GeeksforGeeks", short: "GFG", color: "#2F8D46", icon: "/icons/gfg.svg" },
  other: { label: "Other", short: "—", color: "#a3a3a3", icon: null },
};

// same colours the Dashboard's DifficultyChart uses
export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: "#4ade80",
  Medium: "#facc15",
  Hard: "#f87171",
};

export const VERDICT_COLOR: Record<VerdictKind, string> = {
  ac: "#4ade80",
  wa: "#f87171",
  tle: "#facc15",
  mle: "#facc15",
  re: "#f87171",
  ce: "#a3a3a3",
  other: "#a3a3a3",
};

export const cardClass = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md";

// ---------------------------------------------------------------- layout

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(cardClass, "p-4 sm:p-5 flex flex-col min-w-0", className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-white/90">{title}</h3>
          {subtitle && <p className="text-xs text-white/45 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function TextButton({
  children,
  onClick,
  href,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const cls = cn(
    "inline-flex items-center gap-1 text-xs font-medium text-white/45 hover:text-white transition-colors",
    className
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/[0.06]", className)} />;
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs text-red-300/90">
      <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-medium text-white/70 hover:text-white">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/40">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- badges

export function PlatformIcon({ platform, size = 16 }: { platform: PlatformKey | "other"; size?: number }) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${meta.color}20`, width: size + 14, height: size + 14 }}
      title={meta.label}
    >
      {meta.icon ? (
        <Image src={meta.icon} alt={meta.label} width={size} height={size} />
      ) : (
        <span className="text-[10px] font-semibold text-white/60">{meta.short}</span>
      )}
    </span>
  );
}

export function PlatformTag({ platform }: { platform: PlatformKey | "other" }) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold"
      style={{ color: meta.color, backgroundColor: `${meta.color}1f` }}
    >
      {meta.short}
    </span>
  );
}

export function DifficultyPill({ difficulty }: { difficulty: Difficulty | null }) {
  if (!difficulty) return null;
  const color = DIFFICULTY_COLOR[difficulty];
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ color, backgroundColor: `${color}1a`, border: `1px solid ${color}33` }}
    >
      {difficulty}
    </span>
  );
}

export function ProgressBar({ value, color, className }: { value: number; color: string; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- formatting

export function formatNumber(n: number | null | undefined) {
  return n == null ? "—" : n.toLocaleString("en-IN");
}

export function timeAgo(ts: number, now: number | null) {
  if (!now) return "";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  return mo < 12 ? `${mo}mo ago` : `${Math.round(mo / 12)}y ago`;
}

/** ms → { d, h, m, s } */
export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export function startsIn(start: number, now: number | null) {
  if (!now) return "";
  if (start <= now) return "Live now";
  const { d, h, m } = splitDuration(start - now);
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

export function formatContestDate(ms: number) {
  return new Date(ms).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
