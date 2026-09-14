// src/components/sections/dashboard/ActivityChart.tsx
"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ActivityDataPoint {
  day: string;
  problems: number;
}

interface ActivityChartProps {
  data: ActivityDataPoint[];
  title?: string;
}

export function ActivityChart({ data, title = "Weekly Activity" }: ActivityChartProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 sm:p-6 h-[300px] sm:h-[340px] flex flex-col">
      <h3 className="text-sm sm:text-base font-semibold mb-4">{title}</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#18CCFC" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#18CCFC" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="problems" stroke="#18CCFC" fill="url(#colorProblems)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}