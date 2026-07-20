import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { get } from "../api/client";
import type { ActivityEvent, Page, Project } from "../api/types";
import { PageHeader, RetryPanel } from "../components/AppShell";
import { Badge, EmptyState, Panel, Spinner } from "../components/ui";
import { eventLabel, money, relativeDate, statusLabels } from "../lib/format";

interface DashboardSummary {
  active_projects: number;
  briefs_waiting: number;
  scopes_waiting: number;
  pending_change_requests: number;
}

export function DashboardPage() {
  const summary = useQuery({ queryKey: ["dashboard"], queryFn: () => get<DashboardSummary>("/dashboard") });
  const projects = useQuery({ queryKey: ["projects", "dashboard"], queryFn: () => get<Page<Project>>("/projects?page_size=5") });
  const activity = useQuery({ queryKey: ["activity", "recent"], queryFn: () => get<Page<ActivityEvent>>("/activity?page_size=7") });

  if (summary.isLoading || projects.isLoading || activity.isLoading) return <Spinner label="Loading your dashboard" />;
  if (summary.error) return <RetryPanel message={summary.error.message} onRetry={() => void summary.refetch()} />;

  const metrics = [
    ["Active projects", summary.data?.active_projects ?? 0, "All work currently moving", "text-ink"],
    ["Waiting for brief", summary.data?.briefs_waiting ?? 0, "Clients hold the next action", "text-ink"],
    ["Scope approvals", summary.data?.scopes_waiting ?? 0, "Published versions under review", "text-[#9a5d08]"],
    ["Change requests", summary.data?.pending_change_requests ?? 0, "Extra work awaiting decision", "text-coral"],
  ] as const;

  return (
    <div className="animate-rise">
      <PageHeader eyebrow="Workspace pulse" title="Keep every project moving" description="The next client action and the latest agreement, at a glance." action={<Link to="/projects" className="focus-ring inline-flex min-h-[46px] items-center gap-2 bg-forest px-5 text-sm font-bold text-white">View all projects <ArrowRight size={16} /></Link>} />
      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, description, tone]) => (
          <article key={label} className="bg-white p-5 sm:p-6">
            <p className="text-[13px] font-semibold text-sage">{label}</p>
            <p className={`mt-5 font-display text-[40px] font-semibold leading-none tracking-[-0.02em] ${tone}`}>{value}</p>
            <p className="mt-2 text-[13px] leading-5 text-sage">{description}</p>
          </article>
        ))}
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel>
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <h2 className="font-display font-semibold text-ink">Recent projects</h2>
            <Link to="/projects" className="text-xs font-bold text-sage hover:text-forest">View all</Link>
          </div>
          {projects.data?.items.length ? (
            <div className="divide-y divide-line">
              {projects.data.items.map((project) => (
                <Link key={project.id} to="/projects/$projectId" params={{ projectId: project.id }} className="focus-ring grid gap-3 px-5 py-5 transition hover:bg-paper sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6">
                  <div className="min-w-0"><p className="truncate text-[14.5px] font-bold text-ink">{project.name}</p><p className="mt-1 text-[13px] text-sage">{project.client_name}</p></div>
                  <Badge tone={project.status === "approved" ? "success" : project.status === "waiting_for_approval" ? "warning" : "neutral"}>{statusLabels[project.status]}</Badge>
                  <p className="text-[14.5px] font-bold text-ink sm:w-24 sm:text-right">{money(project.base_price, project.currency)}</p>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="No projects yet" description="Create a project and the full client workflow will appear here." action={<Link to="/projects" className="font-bold text-forest">Create a project →</Link>} />}
        </Panel>

        <Panel>
          <div className="border-b border-line px-5 py-4 sm:px-6"><h2 className="font-display font-semibold text-ink">Recent activity</h2></div>
          <div className="divide-y divide-line px-5 sm:px-6">
            {activity.data?.items.map((event) => (
              <div key={event.id} className="relative py-4 pl-5 before:absolute before:left-0 before:top-5 before:size-2 before:rounded-full before:bg-coral">
                <p className="text-sm leading-5 text-ink"><strong>{event.actor_name}</strong> {eventLabel(event.event_type)}</p>
                <p className="mt-1 text-xs font-semibold text-sage">{relativeDate(event.created_at)}</p>
              </div>
            ))}
            {!activity.data?.items.length ? <p className="py-8 text-center text-sm text-sage">Activity will appear as the project moves.</p> : null}
          </div>
          <div className="m-5 border border-[#eceee9] bg-paper px-[18px] py-4"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-coral">Next action</p><p className="mt-1.5 text-[13.5px] font-bold">{summary.data?.briefs_waiting ?? 0} clients still owe you a brief</p><Link to="/projects" className="mt-2 inline-block text-[13px] font-bold text-forest">Send reminders →</Link></div>
        </Panel>
      </div>
    </div>
  );
}
