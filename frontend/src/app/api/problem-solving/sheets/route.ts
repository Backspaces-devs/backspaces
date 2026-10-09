// src/app/api/problem-solving/sheets/route.ts — DSA sheet progress.
// GET → { [sheetId]: completedProblemIds[] }
// PUT { sheetId, problemIds: string[], done: boolean } → updated progress
// Proxies to the Express backend (MongoDB) at API_URL.
import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/problemSolving/backend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return forwardToBackend("/api/sheets/progress");
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.sheetId !== "string" ||
    !Array.isArray(body.problemIds) ||
    typeof body.done !== "boolean"
  ) {
    return NextResponse.json({ error: "sheetId, problemIds[] and done are required" }, { status: 400 });
  }
  return forwardToBackend("/api/sheets/progress", { method: "PUT", body });
}
