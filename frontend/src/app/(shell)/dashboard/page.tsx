// src/app/(shell)/dashboard/page.tsx
import { PlatformCard } from "@/components/shell/dashboard/PlatformCard";
import { ActivityChart } from "@/components/shell/dashboard/ActivityChart";
import { DifficultyChart } from "@/components/shell/dashboard/DifficultyChart";
import profileStats from "@/app/MockDataFolder/profileStats.json";

//MockData
const weeklyActivity = [
  { day: "Mon", problems: 4 },
  { day: "Tue", problems: 7 },
  { day: "Wed", problems: 3 },
  { day: "Thu", problems: 9 },
  { day: "Fri", problems: 6 },
  { day: "Sat", problems: 12 },
  { day: "Sun", problems: 8 },
];

const difficultyBreakdown = [
  { name: "Easy", value: 45, color: "#4ade80" },
  { name: "Medium", value: 98, color: "#facc15" },
  { name: "Hard", value: 32, color: "#f87171" },
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
        {profileStats.platforms.map((p) => (
          <PlatformCard key={p.name} {...p} />
        ))}
      </div>

      {/* Analytics Section */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActivityChart data={weeklyActivity} />
          <DifficultyChart data={difficultyBreakdown} />
        </div>
      </div>
    </div>
  );
}