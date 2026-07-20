import { createFileRoute } from "@tanstack/react-router";

import { ProjectOverviewPage } from "../../../pages/ProjectOverviewPage";

export const Route = createFileRoute("/_app/projects/$projectId")({
  component: ProjectOverviewPage,
});

