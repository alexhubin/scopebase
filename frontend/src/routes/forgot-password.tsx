import { createFileRoute } from "@tanstack/react-router";

import { ForgotPasswordPage } from "../pages/AuthPages";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — ScopeBase" }] }),
  component: ForgotPasswordPage,
});

