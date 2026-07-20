import { createFileRoute } from "@tanstack/react-router";

import { ChangeRequestsPage } from "../../../../pages/ChangeRequestsPage";

export const Route = createFileRoute("/_app/projects/$projectId/changes")({
  component: ChangeRequestsPage,
});
