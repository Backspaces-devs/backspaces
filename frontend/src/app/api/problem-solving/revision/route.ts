// src/app/api/problem-solving/revision/route.ts — spaced-repetition queue.
// GET  → all tasks (soonest due first)
// POST → add a problem to the queue (idempotent per platform + slug)
// Proxies to the Express backend (MongoDB) at API_URL.
import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/problemSolving/backend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return forwardToBackend("/api/revision");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || typeof body.slug !== "string") {
    return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
  }
  return forwardToBackend("/api/revision", { method: "POST", body });
}
