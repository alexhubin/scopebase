import { createFileRoute } from "@tanstack/react-router";

import { ProtectedLayout } from "../components/AppShell";

export const Route = createFileRoute("/_app")({ component: ProtectedLayout });

