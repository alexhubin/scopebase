import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ResetPasswordPage } from "../pages/AuthPages";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({ token: z.string().catch("") }),
  head: () => ({ meta: [{ title: "Choose new password — ScopeBase" }] }),
  component: ResetRoute,
});

function ResetRoute() {
  const { token } = Route.useSearch();
  return <ResetPasswordPage token={token} />;
}

