import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@base-ui/react/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { get, post } from "../api/client";
import type { Page, Project, ProjectStatus } from "../api/types";
import { PageHeader, RetryPanel } from "../components/AppShell";
import { Badge, Button, EmptyState, Field, Input, Panel, Select, Spinner, Textarea } from "../components/ui";
import { money, shortDate, statusLabels } from "../lib/format";

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(5000),
  client_name: z.string().min(2),
  client_email: z.email(),
  currency: z.string().length(3),
  base_price: z.coerce.number().min(0),
  target_delivery_date: z.string().optional(),
});
type ProjectValues = z.infer<typeof projectSchema>;

export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["projects", search, status],
    queryFn: () => get<Page<Project>>(`/projects?search=${encodeURIComponent(search)}&status=${status}&page_size=50`),
  });
  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { description: "", currency: "EUR", base_price: 0 },
  });
  const create = useMutation({
    mutationFn: (values: ProjectValues) => post<Project>("/projects", { ...values, target_delivery_date: values.target_delivery_date || null }),
    onSuccess: () => {
      toast.success("Project created");
      setOpen(false);
      form.reset({ description: "", currency: "EUR", base_price: 0 });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div className="animate-rise">
      <PageHeader eyebrow="Client work" title="Projects" description="Each project holds its current scope, decisions, files, and the next client action." action={<Button type="button" onClick={() => setOpen(true)}><Plus size={17} /> New project</Button>} />
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]">
        <label className="relative"><Search className="absolute left-3.5 top-3 text-sage" size={17} /><Input aria-label="Search projects" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project or client" className="pl-10" /></label>
        <Select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus | "")}>
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </div>
      {query.isLoading ? <Spinner label="Loading projects" /> : query.error ? <RetryPanel message={query.error.message} onRetry={() => void query.refetch()} /> : query.data?.items.length ? (
        <Panel>
          <div className="hidden grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr] gap-5 border-b border-line px-6 py-3 text-xs font-extrabold uppercase tracking-[0.1em] text-sage md:grid"><span>Project</span><span>Status</span><span>Delivery</span><span className="text-right">Value</span></div>
          <div className="divide-y divide-line">
            {query.data.items.map((project) => (
              <Link key={project.id} to="/projects/$projectId" params={{ projectId: project.id }} className="focus-ring grid gap-3 px-5 py-5 transition hover:bg-paper md:grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr] md:items-center md:gap-5 md:px-6">
                <div className="min-w-0"><p className="truncate font-extrabold text-ink">{project.name}</p><p className="mt-1 truncate text-xs text-sage">{project.client_name} · {project.client_email}</p></div>
                <div><Badge tone={project.status === "approved" ? "success" : project.status.includes("waiting") ? "warning" : "neutral"}>{statusLabels[project.status]}</Badge></div>
                <p className="text-sm text-sage">{shortDate(project.target_delivery_date)}</p>
                <p className="text-sm font-extrabold text-ink md:text-right">{money(project.base_price, project.currency)}</p>
              </Link>
            ))}
          </div>
        </Panel>
      ) : <EmptyState title="Create your first client project" description="Start with the client and commercial basics. You will configure the brief in the project workspace." action={<Button type="button" onClick={() => setOpen(true)}><Plus size={17} /> New project</Button>} />}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-sm" />
          <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
            <Dialog.Popup className="w-full max-w-2xl border border-line bg-paper p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between"><div><Dialog.Title className="text-2xl font-extrabold tracking-tight text-ink">New project</Dialog.Title><Dialog.Description className="mt-2 text-sm text-sage">Add the project essentials. The brief comes next.</Dialog.Description></div><Dialog.Close className="focus-ring rounded-lg p-2 text-sage hover:bg-mint"><X size={20} /></Dialog.Close></div>
              <form className="mt-7 grid gap-5" onSubmit={(event) => void form.handleSubmit((values) => create.mutateAsync(values))(event)}>
                <Field label="Project name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
                <Field label="Short description" error={form.formState.errors.description?.message}><Textarea {...form.register("description")} /></Field>
                <div className="grid gap-5 sm:grid-cols-2"><Field label="Client name" error={form.formState.errors.client_name?.message}><Input {...form.register("client_name")} /></Field><Field label="Client email" error={form.formState.errors.client_email?.message}><Input type="email" {...form.register("client_email")} /></Field></div>
                <div className="grid gap-5 sm:grid-cols-3"><Field label="Base price"><Input type="number" min="0" step="0.01" {...form.register("base_price")} /></Field><Field label="Currency"><Input maxLength={3} {...form.register("currency")} /></Field><Field label="Target delivery"><Input type="date" {...form.register("target_delivery_date")} /></Field></div>
                {create.error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{create.error.message}</p> : null}
                <div className="flex justify-end gap-3"><Dialog.Close render={<Button type="button" variant="ghost" />}>Cancel</Dialog.Close><Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create project"}</Button></div>
              </form>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
