import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Clipboard, Plus, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { get, patch, post } from "../api/client";
import type { ChangeRequest, Project, PublicLink } from "../api/types";
import { Badge, Button, EmptyState, Field, Input, Panel, Spinner, Textarea } from "../components/ui";
import { money, shortDate } from "../lib/format";

type ChangeDraft = {
  title: string;
  description: string;
  reason: string;
  additional_price: string;
  additional_days: number;
};

const emptyDraft: ChangeDraft = {
  title: "",
  description: "",
  reason: "",
  additional_price: "0.00",
  additional_days: 0,
};

export function ChangeRequestsPage() {
  const { projectId } = useParams({ from: "/_app/projects/$projectId/changes" });
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ChangeDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const project = useQuery({ queryKey: ["project", projectId], queryFn: () => get<Project>(`/projects/${projectId}`) });
  const changes = useQuery({ queryKey: ["project-changes", projectId], queryFn: () => get<ChangeRequest[]>(`/projects/${projectId}/change-requests`) });
  const save = useMutation({
    mutationFn: (payload: ChangeDraft) => editingId
      ? patch<ChangeRequest>(`/projects/${projectId}/change-requests/${editingId}`, payload)
      : post<ChangeRequest>(`/projects/${projectId}/change-requests`, payload),
    onSuccess: (data) => {
      setDraft(null);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["project-changes", projectId] });
      toast.success(`Change request “${data.title}” saved`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const publish = useMutation({
    mutationFn: (id: string) => post<PublicLink>(`/projects/${projectId}/change-requests/${id}/publish`, { expires_in_days: 14 }),
    onSuccess: (data) => {
      setPublicLink(data.url);
      void queryClient.invalidateQueries({ queryKey: ["project-changes", projectId] });
      toast.success("Change request sent to the client");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => post<{ message: string }>(`/projects/${projectId}/change-requests/${id}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-changes", projectId] });
      toast.success("Change request cancelled");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (project.isLoading || changes.isLoading) return <Spinner label="Loading change requests" />;
  if (!project.data || changes.error) return <EmptyState title="Change requests unavailable" description={changes.error?.message ?? "Project not found"} />;

  const edit = (item: ChangeRequest) => {
    setEditingId(item.id);
    setDraft({ title: item.title, description: item.description, reason: item.reason, additional_price: item.additional_price, additional_days: item.additional_days });
  };
  const submit = () => {
    if (!draft) return;
    if (draft.title.trim().length < 2 || draft.description.trim().length < 5 || draft.reason.trim().length < 5) {
      toast.error("Add a title, description, and reason for the change");
      return;
    }
    save.mutate({ ...draft, title: draft.title.trim(), description: draft.description.trim(), reason: draft.reason.trim() });
  };
  const copyLink = async () => {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    toast.success("Approval link copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h2 className="text-[22px] font-semibold">Change requests</h2><p className="mt-1.5 text-[14.5px] leading-6 text-[#52625d]">Document extra work with its exact price and schedule impact before starting it.</p></div>{!draft ? <Button variant="accent" onClick={() => { setEditingId(null); setDraft(emptyDraft); }}><Plus size={16} /> New change request</Button> : null}</div>
      {publicLink ? <Panel className="flex flex-col gap-4 border-forest bg-mint/50 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-bold">Client decision link created</p><p className="mt-1 truncate text-xs text-sage">{publicLink}</p></div><Button variant="secondary" onClick={() => void copyLink()}><Clipboard size={16} /> Copy link</Button></Panel> : null}
      {draft ? <Panel><div className="flex items-center justify-between border-b border-line px-6 py-4"><h3 className="font-display font-semibold">{editingId ? "Edit draft" : "New change request"}</h3><Button className="min-h-8 px-2" variant="ghost" aria-label="Close editor" onClick={() => { setDraft(null); setEditingId(null); }}><X size={16} /></Button></div><div className="grid gap-5 p-6"><Field label="Title"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Add analytics dashboard" /></Field><Field label="Description"><Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Describe the additional work and expected result." /></Field><Field label="Reason for change"><Textarea className="min-h-20" value={draft.reason} onChange={(event) => setDraft({ ...draft, reason: event.target.value })} placeholder="Explain why this falls outside the approved scope." /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label={`Additional price (${project.data.currency})`}><Input type="number" min={0} step="0.01" value={draft.additional_price} onChange={(event) => setDraft({ ...draft, additional_price: event.target.value })} /></Field><Field label="Additional delivery days"><Input type="number" min={0} max={365} value={draft.additional_days} onChange={(event) => setDraft({ ...draft, additional_days: Number(event.target.value) })} /></Field></div><div><Button onClick={submit} disabled={save.isPending}>Save draft</Button></div></div></Panel> : null}
      {changes.data?.length ? <Panel><div className="border-b border-line px-6 py-4"><h3 className="font-display font-semibold">Request history</h3></div><div className="divide-y divide-line">{changes.data.map((item) => <div key={item.id} className="flex flex-col justify-between gap-4 px-6 py-5 lg:flex-row lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[14.5px] font-bold">{item.title}</p><ChangeBadge status={item.status} /></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-sage">{item.description}</p><p className="mt-2 text-xs font-bold text-sage">+{money(item.additional_price, project.data.currency)} · +{item.additional_days} days · {shortDate(item.created_at)}</p>{item.client_comment ? <p className="mt-2 border-l-2 border-coral pl-3 text-xs text-sage">Client: {item.client_comment}</p> : null}</div><div className="flex shrink-0 flex-wrap gap-2">{item.status === "draft" ? <Button variant="secondary" onClick={() => edit(item)}>Edit</Button> : null}{item.status === "draft" || item.status === "pending" ? <Button onClick={() => publish.mutate(item.id)} disabled={publish.isPending}><Send size={15} /> {item.status === "pending" ? "Send new link" : "Publish"}</Button> : null}{item.status === "pending" ? <Button variant="ghost" onClick={() => cancel.mutate(item.id)} disabled={cancel.isPending}>Cancel</Button> : null}</div></div>)}</div></Panel> : !draft ? <EmptyState title="No change requests" description="When a client asks for work outside the approved scope, document it here before proceeding." action={<Button onClick={() => setDraft(emptyDraft)}>Create request</Button>} /> : null}
    </div>
  );
}

function ChangeBadge({ status }: { status: ChangeRequest["status"] }) {
  const tone = status === "accepted" ? "success" : status === "pending" ? "warning" : status === "rejected" || status === "cancelled" ? "neutral" : "info";
  return <Badge tone={tone}>{status}</Badge>;
}
