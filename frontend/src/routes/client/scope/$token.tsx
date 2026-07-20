import { createFileRoute } from "@tanstack/react-router";

import { PublicScopePage } from "../../../pages/PublicScopePage";

export const Route = createFileRoute("/client/scope/$token")({
  component: PublicScopePage,
});
