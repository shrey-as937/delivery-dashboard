"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProjects, fetchStaleCheck } from "@/lib/api";
import { ProjectListItem } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[] | null>(null);
  const [staleMap, setStaleMap] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects()
      .then(async (data) => {
        setProjects(data);
        // Check stale status for all projects
        const checks = await Promise.allSettled(
          data.map((p) => fetchStaleCheck(p.id).then((res) => ({ id: p.id, stale: res.stale })))
        );
        const map: Record<number, boolean> = {};
        checks.forEach((c) => {
          if (c.status === "fulfilled") {
            map[c.value.id] = c.value.stale;
          }
        });
        setStaleMap(map);
      })
      .catch((e) => setError(e.message));
  }, []);

  const counts = {
    total: projects?.length ?? 0,
    on_track: projects?.filter((p) => p.status === "on_track").length ?? 0,
    at_risk: projects?.filter((p) => p.status === "at_risk").length ?? 0,
    blocked: projects?.filter((p) => p.status === "blocked").length ?? 0,
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Delivery Operations Center
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Customer Delivery Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Track onboarding milestones, cross-team tasks, categorized blockers, and AI-parsed status updates.
          </p>
        </div>

        {/* Status Metrics Ribbon */}
        {projects && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-soft bg-surface/80 p-2 shadow-card backdrop-blur">
            <div className="flex items-center gap-2 rounded-lg bg-surface-raised px-3 py-1.5 font-mono text-xs text-ink">
              <span className="text-ink-muted">Total:</span>
              <span className="font-semibold text-accent">{counts.total}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-status-green-soft px-3 py-1.5 font-mono text-xs text-status-green">
              <span className="h-1.5 w-1.5 rounded-full bg-status-green" />
              <span>{counts.on_track} On Track</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-status-amber-soft px-3 py-1.5 font-mono text-xs text-status-amber">
              <span className="h-1.5 w-1.5 rounded-full bg-status-amber" />
              <span>{counts.at_risk} At Risk</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-status-red-soft px-3 py-1.5 font-mono text-xs text-status-red">
              <span className="h-1.5 w-1.5 rounded-full bg-status-red" />
              <span>{counts.blocked} Blocked</span>
            </div>
          </div>
        )}
      </header>

      {error && (
        <div className="rounded-xl border border-status-red/30 bg-status-red-soft px-5 py-4 text-sm text-status-red shadow-lg">
          <p className="font-semibold">Backend Connection Warning</p>
          <p className="mt-1 opacity-90">
            Could not reach the FastAPI backend at configured URL ({error}). Ensure FastAPI is running on port 8000.
          </p>
        </div>
      )}

      {/* Loading Skeletons */}
      {!projects && !error && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-border-soft bg-surface/60 p-6"
            />
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {projects && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {projects.map((project) => {
            const isStale = staleMap[project.id];
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/50 hover:bg-surface-raised"
              >
                <div>
                  {/* Card Top Row: Customer & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-accent">
                        {project.customer_name}
                      </p>
                      <h2 className="mt-1 font-display text-xl font-bold text-ink transition-colors group-hover:text-accent">
                        {project.name}
                      </h2>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={project.status} size="sm" />
                      {isStale && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-status-amber/40 bg-status-amber-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-status-amber">
                          <span className="h-1 w-1 rounded-full bg-status-amber animate-ping" />
                          Stale (5d+)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Row: Owners & Action */}
                <div className="mt-8 flex items-center justify-between border-t border-border-soft pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {project.owners.map((owner, idx) => (
                        <div
                          key={idx}
                          title={owner.name}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-accent-soft font-mono text-[11px] font-semibold text-accent shadow-sm"
                        >
                          {owner.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-ink-muted line-clamp-1">
                      {project.owners.map((o) => o.name).join(", ")}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-accent transition-transform group-hover:translate-x-1">
                    Open <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
