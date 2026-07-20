import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Check, MessageSquareText, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { get, post } from "../api/client";
import type { PublicScope } from "../api/types";
import { ClientConfirmation, ClientPortal, ClientPortalError } from "../components/ClientPortal";
import { Badge, Button, Field, Input, Panel, Spinner, Textarea } from "../components/ui";
import { money, shortDate } from "../lib/format";

export function PublicScopePage() {
  const { token } = useParams({ from: "/client/scope/$token" });
  const [decision, setDecision] = useState<"approved" | "changes_requested" | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [comment, setComment] = useState("");
  const [completed, setCompleted] = useState<"approved" | "changes_requested" | null>(null);
  const scope = useQuery({ queryKey: ["public-scope", token], queryFn: () => get<PublicScope>(`/public/scopes/${token}`) });
  const submit = useMutation({
    mutationFn: () => post<{ message: string }>(`/public/scopes/${token}/decision`, { decision, client_name: clientName, client_email: clientEmail, comment: comment || null }),
    onSuccess: () => setCompleted(decision),
    onError: (error: Error) => toast.error(error.message),
  });

  if (completed) return <ClientConfirmation title={completed === "approved" ? "Scope approved" : "Feedback sent"} description={completed === "approved" ? "Your approval is recorded against this exact scope version. The project team can move forward with confidence." : "Your requested changes were sent to the project team. They can prepare a revised scope version for another review."} />;
  if (scope.isLoading) return <ClientPortal><Spinner label="Opening project scope" /></ClientPortal>;
  if (scope.error || !scope.data) return <ClientPortal><ClientPortalError message={scope.error?.message ?? "This link is no longer available."} /></ClientPortal>;
  if (scope.data.approval) return <ClientConfirmation title="Decision already recorded" description={`This scope was marked ${scope.data.approval.decision.replaceAll("_", " ")} on ${shortDate(scope.data.approval.approved_at)}.`} />;

  const document = scope.data.scope;
  const decide = () => {
    if (!decision) return;
    if (clientName.trim().length < 2 || !clientEmail.includes("@")) {
      toast.error("Enter your name and email");
      return;
    }
    if (decision === "changes_requested" && comment.trim().length < 2) {
      toast.error("Describe the changes you need");
      return;
    }
    submit.mutate();
  };

  return (
    <ClientPortal>
      <header className="border border-line bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-coral">Scope for approval</p><Badge tone="warning">Version {document.version_number}</Badge></div><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{document.title}</h1><p className="mt-2 text-sm font-bold text-sage">{scope.data.project_name}</p><div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5"><div><p className="text-xs font-bold text-sage">Project price</p><p className="mt-1 text-xl font-extrabold">{money(document.price, scope.data.currency)}</p></div><div><p className="text-xs font-bold text-sage">Delivery date</p><p className="mt-1 text-xl font-extrabold">{shortDate(document.delivery_date)}</p></div></div></header>
      <Panel className="mt-5 divide-y divide-line"><ScopeSection title="Summary"><p className="text-sm leading-7 text-sage">{document.summary}</p></ScopeSection><ScopeSection title="Deliverables"><div className="grid gap-4">{document.deliverables.map((item) => <div key={item.title}><p className="font-extrabold">{item.title}</p>{item.description ? <p className="mt-1 text-sm leading-6 text-sage">{item.description}</p> : null}</div>)}</div></ScopeSection><ListSection title="Included work" items={document.included_items} /><ListSection title="Excluded work" items={document.excluded_items} /><ListSection title="Assumptions" items={document.assumptions} /><ScopeSection title="Revisions"><p className="text-sm text-sage">Up to {document.revision_limit} revision {document.revision_limit === 1 ? "round" : "rounds"} included.</p></ScopeSection></Panel>
      <Panel className="mt-5 p-5 sm:p-8"><h2 className="text-xl font-extrabold">Record your decision</h2><p className="mt-2 text-sm leading-6 text-sage">Approve this exact version or ask the project team to revise it.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button className="min-h-12" variant={decision === "approved" ? "primary" : "secondary"} onClick={() => setDecision("approved")}><Check size={17} /> Approve scope</Button><Button className="min-h-12" variant={decision === "changes_requested" ? "primary" : "secondary"} onClick={() => setDecision("changes_requested")}><MessageSquareText size={17} /> Request changes</Button></div>{decision ? <div className="mt-6 grid gap-4 border-t border-line pt-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Your name"><Input value={clientName} onChange={(event) => setClientName(event.target.value)} /></Field><Field label="Your email"><Input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} /></Field></div><Field label={decision === "approved" ? "Comment (optional)" : "Changes needed"}><Textarea value={comment} onChange={(event) => setComment(event.target.value)} /></Field><div><Button onClick={decide} disabled={submit.isPending}><Send size={16} /> Submit decision</Button></div></div> : null}</Panel>
    </ClientPortal>
  );
}

function ScopeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="p-5 sm:p-7"><h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.1em] text-ink">{title}</h2>{children}</section>;
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <ScopeSection title={title}><ul className="grid gap-2 text-sm leading-6 text-sage">{items.map((item) => <li key={item} className="flex gap-2"><span className="text-coral">•</span>{item}</li>)}</ul></ScopeSection>;
}
