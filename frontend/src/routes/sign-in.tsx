import { createFileRoute } from "@tanstack/react-router";

import { SignInPage } from "../pages/AuthPages";

export const Route = createFileRoute("/sign-in")({
  head: () => ({ meta: [{ title: "Sign in — ScopeBase" }] }),
  component: SignInPage,
});

