import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { get } from "../api/client";
import type { Project } from "../api/types";
import { RetryPanel } from "./AppShell";
import { Badge, Spinner } from "./ui";
import { money, statusLabels } from "../lib/format";

const sections = [
  { label: "Overview", path: "/projects/$projectId" },
  { label: "Brief", path: "/projects/$projectId/brief" },
  { label: "Scope", path: "/projects/$projectId/scope" },
  { label: "Change requests", path: "/projects/$projectId/changes" },
  { label: "Files", path: "/projects/$projectId/files" },
  { label: "Activity", path: "/projects/$projectId/activity" },
] as const;

export function ProjectWorkspace() {
  const { projectId } = useParams({ from: "/_app/projects/$projectId" });
  const query = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => get<Project>(`/projects/${projectId}`),
  });

  if (query.isLoading) return <Spinner label="Opening project" />;
  if (query.error || !query.data) {
    return (
      <RetryPanel
        message={query.error?.message ?? "Project not found"}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const project = query.data;

  return (
    <div className="animate-rise">
      <Link
        to="/projects"
        className="focus-ring mb-[18px] inline-flex items-center gap-2 text-[13px] font-semibold text-[#52625d] hover:text-forest"
      >
        <ArrowLeft size={16} /> Projects
      </Link>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Badge
            tone={
              project.status === "approved"
                ? "success"
                : project.status.includes("waiting")
                  ? "warning"
                  : "neutral"
            }
          >
            {statusLabels[project.status]}
          </Badge>
          <h1 className="mt-3 font-display text-[30px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">
            {project.name}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#52625d]">
            {project.description || "No project description yet."}
          </p>
        </div>
        <div className="text-left sm:text-right"><span className="text-[12.5px] text-sage">Scope value</span><p className="mt-0.5 font-display text-[28px] font-semibold leading-none text-ink">{money(project.base_price, project.currency)}</p></div>
      </header>
      <nav className="mt-[26px] flex gap-0.5 overflow-x-auto border-b border-line" aria-label="Project sections">
        {sections.map((section) => (
          <Link
            key={section.label}
            to={section.path}
            params={{ projectId }}
            activeOptions={{ exact: section.label === "Overview" }}
            className="focus-ring whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-bold text-sage transition hover:text-ink [&.active]:border-coral [&.active]:text-ink"
          >
            {section.label}
          </Link>
        ))}
      </nav>
      <div className="pt-[26px]">
        <Outlet />
      </div>
    </div>
  );
}
