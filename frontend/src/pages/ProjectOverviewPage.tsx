import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { CalendarDays, Mail, UserRound } from "lucide-react";

import { get } from "../api/client";
import type { Project } from "../api/types";
import { RetryPanel } from "../components/AppShell";
import { Panel, Spinner } from "../components/ui";
import { shortDate } from "../lib/format";

export function ProjectOverviewPage() {
  const { projectId } = useParams({ from: "/_app/projects/$projectId/" });
  const query = useQuery({ queryKey: ["project", projectId], queryFn: () => get<Project>(`/projects/${projectId}`), enabled: Boolean(projectId) });
  if (query.isLoading) return <Spinner label="Opening project" />;
  if (query.error || !query.data) return <RetryPanel message={query.error?.message ?? "Project not found"} onRetry={() => void query.refetch()} />;
  const project = query.data;
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
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
