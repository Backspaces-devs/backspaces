// src/app/api/problem-solving/revision/[id]/route.ts
// POST   { quality: 0-5 } → record a review (SM-2 schedules the next one)
// DELETE                  → remove the problem from the queue
import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/problemSolving/backend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function validId(id: string) {
  return /^[a-f0-9]{24}$/i.test(id);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!validId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await request.json().catch(() => null);
  const quality = Number(body?.quality);
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    return NextResponse.json({ error: "quality must be an integer from 0 to 5" }, { status: 400 });
  }
  return forwardToBackend(`/api/revision/${id}/review`, { method: "POST", body: { quality } });
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!validId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  return forwardToBackend(`/api/revision/${id}`, { method: "DELETE" });
}
