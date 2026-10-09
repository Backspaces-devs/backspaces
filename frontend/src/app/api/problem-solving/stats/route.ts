// src/app/api/problem-solving/stats/route.ts — unified stats for LeetCode,
// Codeforces, CodeChef and GFG. Handles come from the server env
// (LEETCODE_USERNAME, CODEFORCES_USERNAME, CODECHEF_USERNAME, GFG_USERNAME).
// ?refresh=1 skips the 30-min cache (used by the Sync button).
import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/problemSolving/aggregate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("refresh") === "1";
  try {
    return NextResponse.json(await getStats(force));
  } catch {
    return NextResponse.json({ error: "Could not load your coding stats. Try again in a moment." }, { status: 502 });
  }
}
