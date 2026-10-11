// src/lib/problemSolving/backend.ts — forwards revision-queue and sheet-progress
// requests to the Express backend (MongoDB). Same idea as api/news/route.ts:
// the browser only talks to relative /api/* URLs, API_URL stays server-side.
// SERVER ONLY.
import { NextResponse } from "next/server";
import { getOwnerId } from "./server-utils";

const API_URL = process.env.API_URL;
const TIMEOUT_MS = 55_000; // survive a Render free-tier cold start

export async function forwardToBackend(
  path: string,
  init: { method?: string; body?: unknown; query?: Record<string, string> } = {}
): Promise<NextResponse> {
  if (!API_URL) {
    return NextResponse.json(
      { error: "API_URL is not configured. Add it to your environment variables." },
      { status: 503 }
    );
  }

  const url = new URL(path, API_URL);
  url.searchParams.set("user", getOwnerId());
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);

  const method = init.method ?? "GET";
  const body =
    init.body !== undefined && method !== "GET"
      ? JSON.stringify({ ...(init.body as object), user: getOwnerId() })
      : undefined;

  try {
    const res = await fetch(url, {
      method,
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    // The backend's own catch-all 404 ("Route not found: …") means the server at
    // API_URL is running code without the practice routes — not a missing task.
    if (res.status === 404 && typeof data?.error === "string" && data.error.startsWith("Route not found")) {
      return NextResponse.json(
        {
          error:
            "Your backend doesn't have the Problem Solving routes yet. Copy the backend/ files from the update and restart it — if API_URL points to a deployed backend, push and redeploy it.",
          code: "BACKEND_OUTDATED",
        },
        { status: 503 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? `Backend returned ${res.status}. Try again in a moment.` },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Backend is unreachable. It may be waking up — try again in a moment." },
      { status: 502 }
    );
  }
}
