import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "../../pages/DashboardPage";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ScopeBase" }] }),
  component: DashboardPage,
});

