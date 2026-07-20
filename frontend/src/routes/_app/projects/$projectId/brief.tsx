import { createFileRoute } from "@tanstack/react-router";

import { BriefPage } from "../../../../pages/BriefPage";

export const Route = createFileRoute("/_app/projects/$projectId/brief")({
  component: BriefPage,
});
