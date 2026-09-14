"use client";

import { useEffect, useRef, useState } from "react";
import { Users, GitPullRequest, GitMerge, ArrowUpRight } from "lucide-react";
import type { Contributor, ContributorWithPRs, RepoStats } from "@/lib/github";

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();

          const tick = (now: number) => {
            const progress = Math.min((now - start) / durationMs, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, durationMs]);

  return { ref, value };
}

function StatCard({
  icon: Icon,
  label,
  target,
  accent,
}: {
  icon: typeof Users;
  label: string;
  target: number;
  accent: "primary" | "success";
}) {
  const { ref, value } = useCountUp(target);

  return (
    <div
      ref={ref}
      className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 flex items-center gap-4"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          accent === "primary"
            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
            : "bg-[var(--success)]/10 text-[var(--success)]"
        }`}
      >
        <Icon size={18} strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-[var(--foreground)]">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function StatsRow({ stats }: { stats: RepoStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        icon={Users}
        label="Total contributors"
        target={stats.totalContributors}
        accent="primary"
      />
      <StatCard
        icon={GitPullRequest}
        label="Pull requests opened"
        target={stats.pullRequestsOpened}
        accent="primary"
      />
      <StatCard
        icon={GitMerge}
        label="Pull requests merged"
        target={stats.pullRequestsMerged}
        accent="success"
      />
    </div>
  );
}

export function TopContributorsList({
  contributors,
}: {
  contributors: ContributorWithPRs[];
}) {
  const left = contributors.slice(0, 5);
  const right = contributors.slice(5, 10);

  const Row = ({
    rank,
    contributor,
  }: {
    rank: number;
    contributor: ContributorWithPRs;
  }) => (
    <a
      href={contributor.profileUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--muted)]"
    >
      <span className="w-5 shrink-0 text-sm font-medium text-[var(--muted-foreground)]">
        {rank}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={contributor.avatarUrl}
        alt={`${contributor.login}'s avatar`}
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full border border-[var(--border)]"
        loading="lazy"
      />
      <span className="flex-1 truncate text-sm font-medium text-[var(--foreground)]">
        @{contributor.login}
      </span>
      <span className="shrink-0 rounded-full bg-[var(--success)]/10 px-2.5 py-1 font-mono text-xs font-medium text-[var(--success)]">
        {contributor.prsMerged} merged
      </span>
    </a>
  );

  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Top 10 contributors
      </h2>
      <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          {left.map((c, i) => (
            <Row key={c.login} rank={i + 1} contributor={c} />
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {right.map((c, i) => (
            <Row key={c.login} rank={i + 6} contributor={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContributorGrid({
  contributors,
}: {
  contributors: Contributor[];
}) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Our growing contributor community
        </h2>
        <span className="text-xs text-[var(--muted-foreground)]">
          {contributors.length} people
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {contributors.map((c, i) => (
          <a
            key={c.login}
            href={c.profileUrl}
            target="_blank"
            rel="noreferrer"
            title={`@${c.login} · ${c.contributions} commits`}
            className="group relative animate-[fadeInScale_.4s_ease_forwards] opacity-0"
            style={{ animationDelay: `${Math.min(i * 15, 900)}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.avatarUrl}
              alt={`${c.login}'s avatar`}
              width={36}
              height={36}
              loading="lazy"
              className="h-9 w-9 rounded-full border border-[var(--border)] transition-transform duration-150 group-hover:scale-110"
            />
          </a>
        ))}
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .group { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
    </div>
  );
}

export function ContributeCTA({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
    >
      Want to contribute? Join us today
      <ArrowUpRight size={16} strokeWidth={2} />
    </a>
  );
}