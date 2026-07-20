import { createFileRoute } from "@tanstack/react-router";

import { PublicBriefPage } from "../../../pages/PublicBriefPage";

export const Route = createFileRoute("/client/brief/$token")({
  component: PublicBriefPage,
});
