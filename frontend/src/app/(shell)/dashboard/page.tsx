// src/app/(shell)/dashboard/page.tsx
import { PlatformCard } from "@/components/shell/dashboard/PlatformCard";
import { ActivityChart } from "@/components/shell/dashboard/ActivityChart";
import { DifficultyChart } from "@/components/shell/dashboard/DifficultyChart";

const platforms = [
  { name: "LeetCode", logo: "/icons/leetcode.svg", stat: "275", statLabel: "Problems Solved", rank: "Top 12%", color: "#FFA116" },
  { name: "Codeforces", logo: "/icons/codeforces.svg", stat: "1542", statLabel: "Rating · Specialist", rank: "#48,201", color: "#1F8ACB" },
  { name: "GitHub", logo: "/icons/github.svg", stat: "412", statLabel: "Contributions this year", color: "#F5F5F5" },
  { name: "CodeChef", logo: "/icons/codechef.svg", stat: "1789", statLabel: "Rating · 3 Star", rank: "#8,320", color: "#5B4638" },
  { name: "HackerRank", logo: "/icons/hackerrank.svg", stat: "5", statLabel: "Badges Earned", color: "#00EA64" },
  { name: "GeeksforGeeks", logo: "/icons/gfg.svg", stat: "310", statLabel: "Problems Solved", color: "#2F8D46" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, Vidit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s your coding activity across all platforms.
        </p>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((p) => (
          <PlatformCard key={p.name} {...p} />
        ))}
      </div>

      {/* Analytics Section */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActivityChart />
          <DifficultyChart />
        </div>
      </div>
    </div>
  );
}