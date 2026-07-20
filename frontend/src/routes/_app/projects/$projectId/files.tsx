import { createFileRoute } from "@tanstack/react-router";

import { FilesPage } from "../../../../pages/FilesPage";

export const Route = createFileRoute("/_app/projects/$projectId/files")({
  component: FilesPage,
});
