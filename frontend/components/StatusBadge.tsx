const STATUS_STYLES: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  on_track: { dot: "bg-status-green", text: "text-status-green", bg: "bg-status-green-soft", label: "On track" },
  at_risk: { dot: "bg-status-amber", text: "text-status-amber", bg: "bg-status-amber-soft", label: "At risk" },
  blocked: { dot: "bg-status-red", text: "text-status-red", bg: "bg-status-red-soft", label: "Blocked" },
  done: { dot: "bg-status-green", text: "text-status-green", bg: "bg-status-green-soft", label: "Done" },
  open: { dot: "bg-ink-muted", text: "text-ink-muted", bg: "bg-white/[0.04]", label: "Open" },
  closed: { dot: "bg-ink-faint", text: "text-ink-faint", bg: "bg-white/[0.03]", label: "Closed" },
};

export function StatusBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} ${style.text} ${pad} font-mono uppercase tracking-wide`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
