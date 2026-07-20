import { createFileRoute } from "@tanstack/react-router";

import { ScopePage } from "../../../../pages/ScopePage";

export const Route = createFileRoute("/_app/projects/$projectId/scope")({
  component: ScopePage,
});
