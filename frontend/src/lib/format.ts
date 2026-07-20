import type { ProjectStatus } from "../api/types";

export const statusLabels: Record<ProjectStatus, string> = {
  draft: "Draft",
  waiting_for_brief: "Waiting for brief",
  brief_submitted: "Brief submitted",
  scope_draft: "Scope draft",
  waiting_for_approval: "Waiting for approval",
  approved: "Approved",
  completed: "Completed",
  archived: "Archived",
};

export function money(amount: string | number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function shortDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export function relativeDate(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  const days = Math.round(diff / 86_400_000);
  if (Math.abs(days) < 1) return "Today";
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(days, "day");
}

export function eventLabel(event: string) {
  const labels: Record<string, string> = {
    project_created: "created the project",
    brief_link_created: "shared the client brief",
    brief_submitted: "submitted the brief",
    scope_version_created: "created a scope version",
    scope_sent: "sent the scope for review",
    scope_approved: "approved the scope",
    scope_changes_requested: "requested scope changes",
    change_request_created: "created a change request",
    change_request_accepted: "accepted the change request",
    change_request_rejected: "rejected the change request",
    file_uploaded: "uploaded a file",
  };
  return labels[event] ?? event.replaceAll("_", " ");
}

