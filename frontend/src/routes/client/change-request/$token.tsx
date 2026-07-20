import { createFileRoute } from "@tanstack/react-router";

import { PublicChangeRequestPage } from "../../../pages/PublicChangeRequestPage";

export const Route = createFileRoute("/client/change-request/$token")({
  component: PublicChangeRequestPage,
});
