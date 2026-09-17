"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}

export function Toggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
      <button
        onClick={() => onChange("list")}
        aria-label="List view"
        className={cn(
          "flex items-center justify-center size-7 rounded-full transition-colors",
          view === "list" ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"
        )}
      >
        <List className="size-4" />
      </button>
      <button
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        className={cn(
          "flex items-center justify-center size-7 rounded-full transition-colors",
          view === "grid" ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"
        )}
      >
        <LayoutGrid className="size-4" />
      </button>
    </div>
  );
}