export type ProjectStatus = "on_track" | "at_risk" | "blocked";
export type MilestoneStatus = "open" | "blocked" | "done";
export type TaskStatus = "open" | "blocked" | "done";
export type IssueCategory = "Bug" | "Feature Request" | "Question" | "Support" | "Implementation";
export type IssueStatus = "open" | "closed";
export type ViewMode = "internal" | "customer";

export interface OwnerRef {
  id?: number;
  name: string;
  type?: "internal" | "customer";
}

export interface ProjectListItem {
  id: number;
  name: string;
  customer_name: string;
  status: ProjectStatus;
  owners: { name: string }[];
}

export interface Task {
  id: number;
  name: string;
  status: TaskStatus;
  owner: OwnerRef | null;
}

export interface Milestone {
  id: number;
  name: string;
  status: MilestoneStatus;
  due_date: string | null;
  tasks: Task[];
}

export interface ProjectDetail {
  id: number;
  name: string;
  customer_name: string;
  status: ProjectStatus;
  owners: OwnerRef[];
  milestones: Milestone[];
  view: ViewMode;
}

export interface Issue {
  id: number;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  is_customer_visible: boolean;
}

export interface IssuesResponse {
  view: ViewMode;
  issues_by_category: Record<string, Issue[]>;
  total: number;
}

export interface UpdateEntry {
  id: number;
  raw_text: string;
  parsed_summary: string;
  status_change: string | null;
  timestamp: string;
  is_customer_visible: boolean;
}

export interface UpdatesResponse {
  view: ViewMode;
  updates: UpdateEntry[];
}
