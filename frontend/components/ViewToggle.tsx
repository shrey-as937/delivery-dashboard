"use client";

import { ViewMode } from "@/lib/types";

export function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard view mode"
      className="relative grid grid-cols-2 rounded-full border border-border bg-surface p-1 font-mono text-xs shadow-sm"
    >
      <span
        className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-accent shadow transition-all duration-200 ease-out ${
          view === "internal" ? "left-1" : "left-[calc(50%+2px)]"
        }`}
        aria-hidden="true"
      />
      <button
        type="button"
        role="tab"
        aria-selected={view === "internal"}
        onClick={() => onChange("internal")}
        className={`relative z-10 rounded-full px-4 py-2 uppercase tracking-wider transition-colors text-center ${
          view === "internal" ? "text-bg font-bold" : "text-ink-muted hover:text-ink"
        }`}
      >
        Internal View
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "customer"}
        onClick={() => onChange("customer")}
        className={`relative z-10 rounded-full px-4 py-2 uppercase tracking-wider transition-colors text-center ${
          view === "customer" ? "text-bg font-bold" : "text-ink-muted hover:text-ink"
        }`}
      >
        Customer View
      </button>
    </div>
  );
}
