import {
  IssuesResponse,
  ProjectDetail,
  ProjectListItem,
  UpdateEntry,
  UpdatesResponse,
  ViewMode,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request to ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export function fetchProjects(): Promise<ProjectListItem[]> {
  return apiFetch<ProjectListItem[]>("/api/projects");
}

export function fetchProjectDetail(id: number, view: ViewMode): Promise<ProjectDetail> {
  return apiFetch<ProjectDetail>(`/api/projects/${id}?view=${view}`);
}

export function fetchProjectIssues(id: number, view: ViewMode): Promise<IssuesResponse> {
  return apiFetch<IssuesResponse>(`/api/projects/${id}/issues?view=${view}`);
}

export function fetchProjectUpdates(id: number, view: ViewMode): Promise<UpdatesResponse> {
  return apiFetch<UpdatesResponse>(`/api/projects/${id}/updates?view=${view}`);
}

export function postUpdate(params: {
  project_id: number;
  raw_text: string;
  is_customer_visible: boolean;
}): Promise<UpdateEntry> {
  return apiFetch<UpdateEntry>("/api/updates/parse", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function fetchStaleCheck(id: number): Promise<{ stale: boolean; last_update_at: string | null }> {
  return apiFetch(`/api/projects/${id}/stale-check`);
}
