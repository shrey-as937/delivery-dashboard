"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchProjectDetail,
  fetchProjectIssues,
  fetchProjectUpdates,
  fetchStaleCheck,
  postUpdate,
} from "@/lib/api";
import { IssuesResponse, ProjectDetail, UpdatesResponse, ViewMode } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { ViewToggle } from "@/components/ViewToggle";
import { InternalTag } from "@/components/InternalTag";
import { relativeTime } from "@/lib/time";

const CATEGORY_ORDER = ["Bug", "Feature Request", "Question", "Support", "Implementation"] as const;

const DEMO_PRESETS: Record<number, string[]> = {
  1: [
    "Load testing on battery-aware routing wrapped up with 0 errors. Moving Route optimization engine milestone to done!",
    "Legal team approved FAA flight log export schema today. Unblocking Regulatory compliance export milestone to open.",
  ],
  2: [
    "Sam sharded the ledger query by account range, latency dropped below 150ms. Ledger reconciliation sync milestone is now done!",
    "Internal sync: VP approved the security whitepaper for Northlane exec team.",
  ],
  3: [
    "Availity renewed our eligibility sandbox credentials this morning. Moving Insurance eligibility check integration to done.",
    "Grace approved the SMS reminder opt-in copy on our sync call.",
  ],
  4: [
    "Lock-based conflict resolution fix deployed to staging and tested with 3 POS simulators. Warehouse-to-store sync engine is now done!",
    "Store manager alerting dashboard beta launched for 5 flagship stores.",
  ],
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);

  const [view, setView] = useState<ViewMode>("internal");
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [issues, setIssues] = useState<IssuesResponse | null>(null);
  const [updates, setUpdates] = useState<UpdatesResponse | null>(null);
  const [stale, setStale] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [draftVisible, setDraftVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRaw, setExpandedRaw] = useState<Record<number, boolean>>({});

  const loadAll = useCallback(
    (v: ViewMode) => {
      setError(null);
      Promise.all([
        fetchProjectDetail(projectId, v),
        fetchProjectIssues(projectId, v),
        fetchProjectUpdates(projectId, v),
        fetchStaleCheck(projectId),
      ])
        .then(([p, i, u, s]) => {
          setProject(p);
          setIssues(i);
          setUpdates(u);
          setStale(s.stale);
        })
        .catch((e) => setError(e.message));
    },
    [projectId]
  );

  useEffect(() => {
    if (!Number.isNaN(projectId)) {
      loadAll(view);
    }
  }, [projectId, view, loadAll]);

  const isInternal = view === "internal";

  const totalTasks = useMemo(() => {
    if (!project) return { done: 0, total: 0, pct: 0 };
    let done = 0;
    let total = 0;
    for (const m of project.milestones) {
      for (const t of m.tasks) {
        total += 1;
        if (t.status === "done") done += 1;
      }
    }
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [project]);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    try {
      await postUpdate({
        project_id: projectId,
        raw_text: draft.trim(),
        is_customer_visible: draftVisible,
      });
      setDraft("");
      // Refetch updates and stale check
      const [u, s] = await Promise.all([
        fetchProjectUpdates(projectId, view),
        fetchStaleCheck(projectId),
      ]);
      setUpdates(u);
      setStale(s.stale);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleRaw(id: number) {
    setExpandedRaw((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/projects" className="inline-flex items-center gap-1 font-mono text-sm text-accent hover:underline">
          &larr; Back to all projects
        </Link>
        <div className="mt-6 rounded-2xl border border-status-red/30 bg-status-red-soft p-6 text-status-red shadow-lg">
          <p className="font-bold">Error loading project data</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </main>
    );
  }

  if (!project || !issues || !updates) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="h-6 w-32 animate-pulse rounded bg-surface" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-surface" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-surface" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface" />
        </div>
      </main>
    );
  }

  return (
    <main className={`mx-auto max-w-6xl px-6 py-10 transition-all duration-300 ${isInternal ? "" : "max-w-5xl"}`}>
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-accent"
        >
          <span>&larr;</span> Back to Projects
        </Link>

        {/* View Mode Indicator Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider ${
              isInternal
                ? "border border-accent/30 bg-accent-soft text-accent"
                : "border border-status-green/30 bg-status-green-soft text-status-green"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isInternal ? "bg-accent" : "bg-status-green"
              }`}
            />
            {isInternal ? "Internal Ops View" : "Customer Portal View"}
          </span>
        </div>
      </div>

      {/* Header Banner for Customer View */}
      {!isInternal && (
        <div className="mt-4 rounded-xl border border-border-soft bg-surface-raised/80 px-4 py-2.5 text-xs text-ink-muted flex items-center justify-between">
          <span>
            📋 <strong>Customer View:</strong> Showing milestone milestones, verified progress, and approved status updates.
          </span>
          <span className="font-mono text-[10px] uppercase text-status-green bg-status-green-soft px-2 py-0.5 rounded">
            Client Safe
          </span>
        </div>
      )}

      {/* Main Header Card */}
      <header className="mt-5 rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                {project.customer_name}
              </span>
              {isInternal && stale && (
                <span className="inline-flex items-center gap-1 rounded-full border border-status-amber/40 bg-status-amber-soft px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-status-amber">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-amber animate-pulse" />
                  Stale (No updates in 5+ days)
                </span>
              )}
            </div>

            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {project.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />

              <div className="ml-2 flex flex-wrap items-center gap-1.5">
                {project.owners.map((owner) => (
                  <span
                    key={owner.name}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${
                      owner.type === "customer"
                        ? "border-border bg-surface-raised text-ink-muted"
                        : "border-accent/30 bg-accent-soft text-accent"
                    }`}
                  >
                    <span className="font-medium">{owner.name}</span>
                    {isInternal && (
                      <span className="font-mono text-[10px] uppercase opacity-70">
                        ({owner.type})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle Controls & Completion Metric */}
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <ViewToggle view={view} onChange={setView} />
            <div className="flex items-center gap-3">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-raised border border-border-soft">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${totalTasks.pct}%` }}
                />
              </div>
              <span className="font-mono text-xs text-ink-muted">
                {totalTasks.done}/{totalTasks.total} tasks ({totalTasks.pct}%)
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className={`mt-8 grid grid-cols-1 gap-8 ${isInternal ? "lg:grid-cols-[1.5fr_1.1fr]" : "lg:grid-cols-[1.4fr_1fr]"}`}>
        
        {/* Left Column: Milestones & Issues */}
        <div className="space-y-8">
          {/* Milestones Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                Delivery Milestones & Tasks
              </h2>
              <span className="font-mono text-xs text-ink-faint">
                {project.milestones.filter((m) => m.status === "done").length}/{project.milestones.length} Completed
              </span>
            </div>

            <div className="space-y-3">
              {project.milestones.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-colors hover:border-border/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">{m.name}</h3>
                      {m.due_date && (
                        <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                          Target: {new Date(m.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={m.status} size="sm" />
                  </div>

                  {/* Tasks List */}
                  <div className="mt-4 space-y-2 border-t border-border-soft pt-3">
                    {m.tasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-surface-raised/40 px-3 py-2 text-sm transition-colors hover:bg-surface-raised"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              t.status === "done"
                                ? "bg-status-green"
                                : t.status === "blocked"
                                ? "bg-status-red"
                                : "bg-ink-faint"
                            }`}
                          />
                          <span className="text-ink truncate">{t.name}</span>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {isInternal && t.owner && (
                            <span className="hidden font-mono text-[11px] text-ink-faint sm:inline">
                              {t.owner.name}
                            </span>
                          )}
                          <StatusBadge status={t.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Issues Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                Tracked Issues & Blockers <span className="text-accent font-mono">({issues.total})</span>
              </h2>
              {isInternal && (
                <span className="font-mono text-[11px] text-ink-faint">
                  Includes internal & confidential items
                </span>
              )}
            </div>

            <div className="space-y-4">
              {CATEGORY_ORDER.map((cat) => {
                const categoryIssues = issues.issues_by_category[cat] || [];
                if (categoryIssues.length === 0) return null;
                return (
                  <div key={cat} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
                    <div className="flex items-center justify-between border-b border-border-soft pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                          {cat}
                        </span>
                        <span className="rounded-full bg-accent-soft px-2 py-0.2 font-mono text-[10px] text-accent">
                          {categoryIssues.length}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {categoryIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-surface-raised/40 px-3.5 py-2.5 transition-colors hover:bg-surface-raised"
                        >
                          <span className="text-sm text-ink leading-snug">{issue.title}</span>
                          <div className="flex shrink-0 items-center gap-2">
                            {isInternal && !issue.is_customer_visible && <InternalTag />}
                            <StatusBadge status={issue.status} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {issues.total === 0 && (
                <div className="rounded-2xl border border-border-soft bg-surface/50 p-8 text-center text-sm text-ink-muted">
                  No issues to display for this view.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Update Feed & AI Parser */}
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
                Delivery Timeline & Feed
              </h2>
              <span className="font-mono text-xs text-ink-faint">
                {updates.updates.length} entries
              </span>
            </div>

            {/* AI Log Update Form (Internal View Only) */}
            {isInternal && (
              <div className="rounded-2xl border border-accent/30 bg-surface p-5 shadow-card relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-accent">
                    <span>⚡ Gemini 2.5 Flash Parser</span>
                  </div>
                  <span className="text-[11px] font-mono text-ink-faint">Auto-structures chat notes</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Paste informal Slack/email update (e.g. 'Finished load testing on telemetry. Moving telemetry milestone to done!')..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none transition-colors"
                  />

                  {/* Quick Demo Fill Buttons */}
                  {DEMO_PRESETS[projectId] && (
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                        Quick Demo Prompts:
                      </p>
                      <div className="flex flex-col gap-1">
                        {DEMO_PRESETS[projectId].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setDraft(preset)}
                            className="truncate text-left rounded bg-surface-raised px-2 py-1 font-mono text-[11px] text-ink-muted hover:text-accent hover:bg-accent-soft transition-colors"
                          >
                            &bull; {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted select-none">
                      <input
                        type="checkbox"
                        checked={draftVisible}
                        onChange={(e) => setDraftVisible(e.target.checked)}
                        className="h-4 w-4 rounded border-border bg-bg text-accent accent-accent focus:ring-0"
                      />
                      <span>Visible to Customer</span>
                    </label>

                    <button
                      type="submit"
                      disabled={!draft.trim() || submitting}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 font-mono text-xs font-bold text-bg transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40 shadow"
                    >
                      {submitting ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-bg border-t-transparent" />
                          <span>Parsing with Gemini...</span>
                        </>
                      ) : (
                        <span>Log AI Update</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Updates List */}
            <div className="space-y-3">
              {updates.updates.map((u) => {
                const isExpanded = !!expandedRaw[u.id];
                return (
                  <div
                    key={u.id}
                    className="group rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:border-border/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-relaxed text-ink">
                        {u.parsed_summary}
                      </p>
                      {isInternal && !u.is_customer_visible && <InternalTag />}
                    </div>

                    {/* Status Change Tag */}
                    {u.status_change && (
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2.5 py-1 font-mono text-xs font-semibold text-accent">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {u.status_change}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-border-soft pt-2.5">
                      <span className="font-mono text-[11px] text-ink-faint">
                        {relativeTime(u.timestamp)}
                      </span>

                      {/* Raw text viewer toggle for demo inspection */}
                      {isInternal && (
                        <button
                          type="button"
                          onClick={() => toggleRaw(u.id)}
                          className="font-mono text-[10px] uppercase tracking-wider text-ink-faint hover:text-accent transition-colors"
                        >
                          {isExpanded ? "Hide raw note" : "View raw note"}
                        </button>
                      )}
                    </div>

                    {/* Expanded Raw Note Card */}
                    {isInternal && isExpanded && (
                      <div className="mt-2.5 rounded-xl border border-border-soft bg-bg/80 p-3 font-mono text-xs text-ink-muted">
                        <p className="text-[10px] uppercase tracking-wider text-ink-faint mb-1">
                          Original raw input:
                        </p>
                        <p className="italic">{u.raw_text}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {updates.updates.length === 0 && (
                <div className="rounded-2xl border border-border-soft bg-surface/50 p-8 text-center text-sm text-ink-muted">
                  No updates available in this view.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
