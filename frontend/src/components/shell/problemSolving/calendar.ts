// src/components/shell/problemSolving/calendar.ts — "Add to calendar" helpers:
// a Google Calendar template link and a downloadable .ics file.
import type { Contest } from "@/lib/problemSolving/types";
import { PLATFORM_META } from "./ui";

function toCalDate(ms: number) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(c: Contest) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${c.title} (${PLATFORM_META[c.platform].label})`,
    dates: `${toCalDate(c.start)}/${toCalDate(c.start + c.durationSec * 1000)}`,
    details: `Contest link: ${c.url}\n\nAdded from Backspaces`,
    location: c.url,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadIcs(contests: Contest[], filename = "backspaces-contests.ics") {
  const stamp = toCalDate(Date.now());
  const events = contests.map((c) =>
    [
      "BEGIN:VEVENT",
      `UID:${c.id}@backspaces`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toCalDate(c.start)}`,
      `DTEND:${toCalDate(c.start + c.durationSec * 1000)}`,
      `SUMMARY:${escapeIcs(`${c.title} (${PLATFORM_META[c.platform].label})`)}`,
      `DESCRIPTION:${escapeIcs(c.url)}`,
      `URL:${c.url}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Contest starts in 30 minutes",
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n")
  );
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Backspaces//Contests//EN", ...events, "END:VCALENDAR"].join(
    "\r\n"
  );
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
