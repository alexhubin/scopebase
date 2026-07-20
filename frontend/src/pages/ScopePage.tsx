import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Clipboard, Download, FileCheck2, Plus, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { download, get, patch, post } from "../api/client";
import type { Deliverable, Project, PublicLink, ScopeDocument } from "../api/types";
import { Badge, Button, EmptyState, Field, Input, Panel, Spinner, Textarea } from "../components/ui";
import { money, shortDate } from "../lib/format";

type ScopeDraft = {
  title: string;
  summary: string;
  deliverables: Deliverable[];
  included_items: string;
  excluded_items: string;
  assumptions: string;
  revision_limit: number;
  price: string;
  delivery_date: string;
};

function createDraft(project?: Project, source?: ScopeDocument): ScopeDraft {
  return {
    title: source?.title ?? (project ? `${project.name} project scope` : "Project scope"),
    summary: source?.summary ?? "",
    deliverables: source?.deliverables ?? [{ title: "", description: "" }],
    included_items: source?.included_items.join("\n") ?? "",
    excluded_items: source?.excluded_items.join("\n") ?? "",
    assumptions: source?.assumptions.join("\n") ?? "",
    revision_limit: source?.revision_limit ?? 2,
    price: source?.price ?? project?.base_price ?? "0.00",
    delivery_date: source?.delivery_date ?? project?.target_delivery_date ?? "",
  };
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export function ScopePage() {
  const { projectId } = useParams({ from: "/_app/projects/$projectId/scope" });
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ScopeDraft | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => get<Project>(`/projects/${projectId}`),
  });
  const scopes = useQuery({
    queryKey: ["project-scopes", projectId],
    queryFn: () => get<ScopeDocument[]>(`/projects/${projectId}/scopes`),
  });

  useEffect(() => {
    const current = scopes.data?.find((scope) => scope.status === "draft");
    if (current) {
      setDraftId(current.id);
      setDraft(createDraft(project.data, current));
    }
  }, [project.data, scopes.data]);

  const save = useMutation({
    mutationFn: (payload: ReturnType<typeof payloadFromDraft>) =>
      draftId
        ? patch<ScopeDocument>(`/projects/${projectId}/scopes/${draftId}`, payload)
        : post<ScopeDocument>(`/projects/${projectId}/scopes`, payload),
    onSuccess: (data) => {
      setDraftId(data.id);
      void queryClient.invalidateQueries({ queryKey: ["project-scopes", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success(`Scope version ${data.version_number} saved`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const publish = useMutation({
    mutationFn: (scopeId: string) => post<PublicLink>(`/projects/${projectId}/scopes/${scopeId}/publish`, { expires_in_days: 14 }),
    onSuccess: (data) => {
      setPublicLink(data.url);
      setDraft(null);
      setDraftId(null);
      void queryClient.invalidateQueries({ queryKey: ["project-scopes", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Scope sent for review");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (project.isLoading || scopes.isLoading) return <Spinner label="Loading scope" />;
  if (!project.data || scopes.error) return <EmptyState title="Scope unavailable" description={scopes.error?.message ?? "Project not found"} />;

  const ordered = scopes.data ?? [];
  const latest = ordered[0];
  const canStart = !draft && !ordered.some((scope) => scope.status === "draft");

  const beginDraft = () => {
    setDraftId(null);
    setDraft(createDraft(project.data, latest));
  };

  const saveDraft = () => {
    if (!draft) return;
    if (draft.title.trim().length < 2 || draft.summary.trim().length < 10) {
      toast.error("Add a title and a more detailed project summary");
      return;
    }
    if (!draft.deliverables.length || draft.deliverables.some((item) => item.title.trim().length < 2)) {
      toast.error("Every deliverable needs a title");
      return;
    }
    save.mutate(payloadFromDraft(draft));
  };

  const copyLink = async () => {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    toast.success("Review link copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><h2 className="text-[22px] font-semibold">Project scope</h2><p className="mt-1.5 text-[14.5px] leading-6 text-[#52625d]">Define what is included, publish a fixed version, and collect the client decision.</p></div>
        {canStart ? <Button onClick={beginDraft}><Plus size={16} /> {latest ? "Create new version" : "Create scope"}</Button> : null}
      </div>

      {publicLink ? <Panel className="flex flex-col gap-4 border-forest bg-mint/50 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-bold">Secure review link created</p><p className="mt-1 truncate text-xs text-sage">{publicLink}</p></div><Button variant="secondary" onClick={() => void copyLink()}><Clipboard size={16} /> Copy link</Button></Panel> : null}

      {draft ? (
        <ScopeForm
          draft={draft}
          setDraft={setDraft}
          saving={save.isPending}
          onSave={saveDraft}
          onPublish={draftId ? () => publish.mutate(draftId) : undefined}
          publishing={publish.isPending}
        />
      ) : null}

      {ordered.length ? (
        <Panel>
          <div className="border-b border-line px-7 py-4"><h3 className="font-display font-semibold">Version history</h3><p className="mt-1 text-xs text-sage">Published versions are immutable and approvals always reference one exact version.</p></div>
          <div className="divide-y divide-line">{ordered.map((scope) => <div key={scope.id} className="flex flex-col justify-between gap-4 px-7 py-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center bg-mint text-forest"><FileCheck2 size={18} /></span><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">Version {scope.version_number} · {scope.title}</p><ScopeBadge status={scope.status} /></div><p className="mt-1 text-xs text-sage">{money(scope.price, project.data.currency)} · {shortDate(scope.delivery_date)} · created {shortDate(scope.created_at)}</p></div></div><div className="flex gap-2">{scope.status === "sent" ? <Button variant="secondary" onClick={() => publish.mutate(scope.id)} disabled={publish.isPending}><Send size={15} /> Send new link</Button> : null}{scope.status === "approved" ? <Button variant="secondary" onClick={() => void download(`/projects/${projectId}/scopes/${scope.id}/pdf`, `${project.data.slug}-scope-v${scope.version_number}.pdf`)}><Download size={15} /> PDF</Button> : null}</div></div>)}</div>
        </Panel>
      ) : !draft ? <EmptyState title="No scope yet" description="Turn the submitted brief into a precise scope the client can approve." action={<Button onClick={beginDraft}>Create first scope</Button>} /> : null}
    </div>
  );
}

function ScopeForm({ draft, setDraft, saving, onSave, onPublish, publishing }: { draft: ScopeDraft; setDraft: (draft: ScopeDraft) => void; saving: boolean; onSave: () => void; onPublish?: () => void; publishing: boolean }) {
  const updateDeliverable = (index: number, value: Partial<Deliverable>) => setDraft({ ...draft, deliverables: draft.deliverables.map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item) });
  return (
    <Panel>
      <div className="flex flex-col justify-between gap-3 border-b border-line px-7 py-4 sm:flex-row sm:items-center"><div><h3 className="text-lg font-semibold">Draft scope</h3><p className="mt-1 text-[13px] text-sage">Save freely until you publish this version. Published versions are immutable.</p></div><div className="flex gap-2"><Button variant="secondary" onClick={onSave} disabled={saving}>Save draft</Button>{onPublish ? <Button variant="accent" onClick={onPublish} disabled={publishing}><Send size={16} /> Publish version</Button> : null}</div></div>
      <div className="grid gap-5 p-7">
        <Field label="Scope title"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field>
        <Field label="Project summary"><Textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Summarize the agreed outcome, audience, and constraints." /></Field>
        <div><div className="flex items-center justify-between"><p className="text-sm font-semibold">Deliverables</p><Button className="min-h-8 px-2" variant="ghost" onClick={() => setDraft({ ...draft, deliverables: [...draft.deliverables, { title: "", description: "" }] })}><Plus size={15} /> Add</Button></div><div className="mt-2 grid gap-3">{draft.deliverables.map((item, index) => <div key={index} className="grid gap-2 border border-line bg-paper/50 p-3 sm:grid-cols-[0.7fr_1fr_auto]"><Input value={item.title} onChange={(event) => updateDeliverable(index, { title: event.target.value })} placeholder="Deliverable title" /><Input value={item.description} onChange={(event) => updateDeliverable(index, { description: event.target.value })} placeholder="What the client receives" /><Button className="min-h-10 px-3 text-red-700" variant="ghost" aria-label="Remove deliverable" onClick={() => setDraft({ ...draft, deliverables: draft.deliverables.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={16} /></Button></div>)}</div></div>
        <div className="grid gap-5 lg:grid-cols-3"><LineField label="Included work" value={draft.included_items} onChange={(value) => setDraft({ ...draft, included_items: value })} /><LineField label="Excluded work" value={draft.excluded_items} onChange={(value) => setDraft({ ...draft, excluded_items: value })} /><LineField label="Assumptions" value={draft.assumptions} onChange={(value) => setDraft({ ...draft, assumptions: value })} /></div>
        <div className="grid gap-5 sm:grid-cols-3"><Field label="Revision limit"><Input type="number" min={0} value={draft.revision_limit} onChange={(event) => setDraft({ ...draft, revision_limit: Number(event.target.value) })} /></Field><Field label="Price"><Input type="number" min={0} step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></Field><Field label="Delivery date"><Input type="date" value={draft.delivery_date} onChange={(event) => setDraft({ ...draft, delivery_date: event.target.value })} /></Field></div>
      </div>
    </Panel>
  );
}

function LineField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label} hint="One item per line"><Textarea value={value} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function ScopeBadge({ status }: { status: ScopeDocument["status"] }) {
  const tone = status === "approved" ? "success" : status === "sent" ? "warning" : status === "superseded" ? "neutral" : "info";
  return <Badge tone={tone}>{status}</Badge>;
}

function payloadFromDraft(draft: ScopeDraft) {
  return {
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    deliverables: draft.deliverables.map((item) => ({ title: item.title.trim(), description: item.description.trim() })),
    included_items: lines(draft.included_items),
    excluded_items: lines(draft.excluded_items),
    assumptions: lines(draft.assumptions),
    revision_limit: draft.revision_limit,
    price: draft.price,
    delivery_date: draft.delivery_date || null,
  };
}
