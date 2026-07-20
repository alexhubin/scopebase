import { createFileRoute } from "@tanstack/react-router";

import { SignUpPage } from "../pages/AuthPages";

export const Route = createFileRoute("/sign-up")({
  head: () => ({ meta: [{ title: "Create workspace — ScopeBase" }] }),
  component: SignUpPage,
});

