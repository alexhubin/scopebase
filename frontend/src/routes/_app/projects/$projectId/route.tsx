import { createFileRoute } from "@tanstack/react-router";

import { ProjectWorkspace } from "../../../../components/ProjectWorkspace";

export const Route = createFileRoute("/_app/projects/$projectId")({
  component: ProjectWorkspace,
});
