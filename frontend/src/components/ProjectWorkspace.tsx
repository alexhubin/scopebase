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
        className="focus-ring mb-5 inline-flex items-center gap-2 rounded text-sm font-bold text-sage hover:text-forest"
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
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
            {project.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-sage">
            {project.description || "No project description yet."}
          </p>
        </div>
        <p className="text-2xl font-extrabold text-ink">
          {money(project.base_price, project.currency)}
        </p>
      </header>
      <nav className="mt-7 flex gap-1 overflow-x-auto border-b border-line" aria-label="Project sections">
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
      <div className="pt-7">
        <Outlet />
      </div>
    </div>
  );
}
