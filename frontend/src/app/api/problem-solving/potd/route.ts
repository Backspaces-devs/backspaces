// src/app/api/problem-solving/potd/route.ts — today's LeetCode + GFG problem of the day.
import { NextRequest, NextResponse } from "next/server";
import { getPotd } from "@/lib/problemSolving/aggregate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("refresh") === "1";
  try {
    return NextResponse.json(await getPotd(force));
  } catch {
    return NextResponse.json({ error: "Could not load the problem of the day." }, { status: 502 });
  }
}
