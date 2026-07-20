import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Mail, UserRound } from "lucide-react";

import { get } from "../api/client";
import type { Project } from "../api/types";
import { RetryPanel } from "../components/AppShell";
import { Badge, Panel, Spinner } from "../components/ui";
import { money, shortDate, statusLabels } from "../lib/format";

export function ProjectOverviewPage() {
  const { projectId } = useParams({ strict: false });
  const query = useQuery({ queryKey: ["project", projectId], queryFn: () => get<Project>(`/projects/${projectId}`), enabled: Boolean(projectId) });
  if (query.isLoading) return <Spinner label="Opening project" />;
  if (query.error || !query.data) return <RetryPanel message={query.error?.message ?? "Project not found"} onRetry={() => void query.refetch()} />;
  const project = query.data;
  return (
    <div className="animate-rise">
      <Link to="/projects" className="focus-ring mb-5 inline-flex items-center gap-2 rounded text-sm font-bold text-sage hover:text-forest"><ArrowLeft size={16} /> Projects</Link>
      <div className="flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end"><div><Badge tone={project.status === "approved" ? "success" : project.status.includes("waiting") ? "warning" : "neutral"}>{statusLabels[project.status]}</Badge><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">{project.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-sage">{project.description || "No project description yet."}</p></div><p className="text-2xl font-extrabold text-ink">{money(project.base_price, project.currency)}</p></div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.65fr]">
        <Panel className="p-6"><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-coral">Next action</p><h2 className="mt-3 text-2xl font-extrabold">{nextAction(project)}</h2><p className="mt-3 text-sm leading-6 text-sage">The workspace will keep this project’s brief, scope versions, change requests, files, and activity together.</p></Panel>
        <Panel className="divide-y divide-line"><Info icon={<UserRound size={17} />} label="Client" value={project.client_name} /><Info icon={<Mail size={17} />} label="Email" value={project.client_email} /><Info icon={<CalendarDays size={17} />} label="Target delivery" value={shortDate(project.target_delivery_date)} /></Panel>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 px-5 py-4"><span className="text-coral">{icon}</span><div><p className="text-xs font-bold text-sage">{label}</p><p className="mt-0.5 text-sm font-extrabold text-ink">{value}</p></div></div>;
}

function nextAction(project: Project) {
  const actions: Record<Project["status"], string> = {
    draft: "Configure the client brief",
    waiting_for_brief: "Wait for the client brief",
    brief_submitted: "Review answers and draft the scope",
    scope_draft: "Finish and publish the scope",
    waiting_for_approval: "Wait for the client decision",
    approved: "Deliver the approved scope",
    completed: "Project complete",
    archived: "Project archived",
  };
  return actions[project.status];
}

