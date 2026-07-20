import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { Check } from "lucide-react";

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
  const action = nextAction(project);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="grid content-start gap-6">
        <Panel className="p-6 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-coral">Next action</p>
          <h2 className="mt-3 text-[22px] font-semibold">{action.title}</h2>
          <p className="mt-2.5 max-w-[520px] text-[15px] leading-[1.65] text-[#52625d]">{action.description}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link to={action.path} params={{ projectId }} className="focus-ring bg-forest px-[18px] py-[11px] text-[13.5px] font-bold text-white">{action.cta}</Link>
            <Link to="/projects/$projectId/activity" params={{ projectId }} className="focus-ring border border-line bg-white px-[18px] py-[11px] text-[13.5px] font-bold">View activity</Link>
          </div>
        </Panel>
        <Panel>
          <div className="flex min-h-14 items-center border-b border-line px-6 py-3"><h3 className="text-base font-semibold">Project timeline</h3></div>
          <div className="grid gap-px bg-[#eceee9] sm:grid-cols-2 xl:grid-cols-4">
            <TimelineStep number={1} state={stepState(project.status, 0)} title="Brief" detail="Client requirements" />
            <TimelineStep number={2} state={stepState(project.status, 1)} title="Scope drafted" detail="Versioned agreement" />
            <TimelineStep number={3} state={stepState(project.status, 2)} title="Approval" detail="Client decision" />
            <TimelineStep number={4} state={stepState(project.status, 3)} title="Delivery" detail={shortDate(project.target_delivery_date)} />
          </div>
        </Panel>
      </div>
      <Panel className="h-fit divide-y divide-[#eceee9]">
        <Info label="Client" value={project.client_name} />
        <Info label="Email" value={project.client_email} />
        <Info label="Target delivery" value={shortDate(project.target_delivery_date)} />
        <Info label="Current status" value={project.status.replaceAll("_", " ")} />
      </Panel>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="px-[22px] py-4"><p className="text-[12.5px] text-sage">{label}</p><p className="mt-1 text-[14.5px] font-bold capitalize text-ink">{value}</p></div>;
}

function TimelineStep({ number, state, title, detail }: { number: number; state: "done" | "current" | "upcoming"; title: string; detail: string }) {
  return <div className={`bg-white px-5 py-[18px] ${state === "current" ? "!bg-amber-50" : ""}`}><span className={`grid size-[26px] place-items-center rounded-full text-xs font-bold ${state === "done" ? "bg-[#087a55] text-white" : state === "current" ? "bg-[#9a5d08] text-white" : "border border-line text-sage"}`}>{state === "done" ? <Check size={14} /> : state === "current" ? "…" : number}</span><strong className={`mt-2.5 block text-[13.5px] ${state === "upcoming" ? "text-sage" : ""}`}>{title}</strong><span className={`mt-0.5 block text-xs ${state === "current" ? "text-[#9a5d08]" : "text-sage"}`}>{detail}</span></div>;
}

function stepState(status: Project["status"], index: number): "done" | "current" | "upcoming" {
  const current = {
    draft: 0,
    waiting_for_brief: 0,
    brief_submitted: 1,
    scope_draft: 1,
    waiting_for_approval: 2,
    approved: 3,
    completed: 4,
    archived: 4,
  }[status];
  if (index < current) return "done";
  if (index === current) return "current";
  return "upcoming";
}

function nextAction(project: Project) {
  const actions: Record<Project["status"], { title: string; description: string; cta: string; path: "/projects/$projectId/brief" | "/projects/$projectId/scope" | "/projects/$projectId/activity" }> = {
    draft: { title: "Configure the client brief", description: "Choose the questions that will give you enough context to define a precise scope.", cta: "Configure brief", path: "/projects/$projectId/brief" },
    waiting_for_brief: { title: "Wait for the client brief", description: `The secure brief link is with ${project.client_email}. You will be notified when the answers arrive.`, cta: "Open brief", path: "/projects/$projectId/brief" },
    brief_submitted: { title: "Review answers and draft the scope", description: "The client brief is complete. Turn the answers into deliverables, boundaries, price, and delivery date.", cta: "Draft scope", path: "/projects/$projectId/scope" },
    scope_draft: { title: "Finish and publish the scope", description: "Save freely until the scope is ready, then publish an immutable version for the client.", cta: "Open scope", path: "/projects/$projectId/scope" },
    waiting_for_approval: { title: "Wait for the client decision", description: `The latest scope was sent to ${project.client_email}. You will be notified the moment a decision is recorded.`, cta: "Open scope", path: "/projects/$projectId/scope" },
    approved: { title: "Deliver the approved scope", description: "The client approved the latest version. Keep any additional work explicit with change requests.", cta: "View activity", path: "/projects/$projectId/activity" },
    completed: { title: "Project complete", description: "The approved work and its decision history remain available in this workspace.", cta: "View activity", path: "/projects/$projectId/activity" },
    archived: { title: "Project archived", description: "This project is read-only, with its agreement history preserved.", cta: "View activity", path: "/projects/$projectId/activity" },
  };
  return actions[project.status];
}
