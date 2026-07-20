import { createFileRoute } from "@tanstack/react-router";

import { ProjectsPage } from "../../../pages/ProjectsPage";

export const Route = createFileRoute("/_app/projects/")({
  head: () => ({ meta: [{ title: "Projects — ScopeBase" }] }),
  component: ProjectsPage,
});

