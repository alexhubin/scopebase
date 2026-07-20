import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "../pages/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScopeBase — Clear scope, confident projects" },
      {
        name: "description",
        content: "Collect client requirements, publish a clear scope, and keep every change explicit.",
      },
    ],
  }),
  component: LandingPage,
});

