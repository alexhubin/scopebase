import { createFileRoute } from "@tanstack/react-router";

import { ActivityPage } from "../../../../pages/ActivityPage";

export const Route = createFileRoute("/_app/projects/$projectId/activity")({
  component: ActivityPage,
});
