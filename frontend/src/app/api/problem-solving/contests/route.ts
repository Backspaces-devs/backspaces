// src/app/api/problem-solving/contests/route.ts — upcoming contests from
// LeetCode, Codeforces and CodeChef, merged and sorted by start time.
import { NextRequest, NextResponse } from "next/server";
import { getContests } from "@/lib/problemSolving/aggregate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("refresh") === "1";
  try {
    return NextResponse.json(await getContests(force));
  } catch {
    return NextResponse.json({ error: "Could not load upcoming contests." }, { status: 502 });
  }
}
