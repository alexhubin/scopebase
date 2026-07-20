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
      <div className="border border-line bg-white">
        <header className="border-b border-line px-6 py-8 sm:px-9"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Scope for approval</p><Badge tone="warning">Version {document.version_number}</Badge></div><h1 className="mt-3 text-[28px] font-semibold tracking-[-0.02em]">{document.title}</h1><p className="mt-2 text-sm text-[#52625d]">{scope.data.project_name} · prepared for {scope.data.client_name}</p></header>
        <div className="grid grid-cols-2 gap-px border-b border-line bg-line"><div className="bg-white px-6 py-[18px] sm:px-9"><p className="text-[12.5px] text-sage">Project price</p><p className="mt-1 font-display text-2xl font-semibold">{money(document.price, scope.data.currency)}</p></div><div className="bg-white px-6 py-[18px] sm:px-9"><p className="text-[12.5px] text-sage">Delivery date</p><p className="mt-1 font-display text-2xl font-semibold">{shortDate(document.delivery_date)}</p></div></div>
        <div className="divide-y divide-[#eceee9]"><ScopeSection title="Summary"><p className="text-[15px] leading-[1.7] text-[#52625d]">{document.summary}</p></ScopeSection><ScopeSection title="Deliverables"><div className="grid gap-3">{document.deliverables.map((item) => <div key={item.title}><p className="text-[15px] font-bold">{item.title}</p>{item.description ? <p className="mt-1 text-[15px] leading-[1.7] text-[#52625d]">{item.description}</p> : null}</div>)}</div></ScopeSection><div className="grid gap-px bg-[#eceee9] sm:grid-cols-2"><ListSection tone="success" title="Included work" items={document.included_items} /><ListSection tone="danger" title="Excluded work" items={document.excluded_items} /></div>{document.assumptions.length ? <ListSection title="Assumptions" items={document.assumptions} /> : null}<ScopeSection title="Revisions"><p className="text-sm text-sage">Up to {document.revision_limit} revision {document.revision_limit === 1 ? "round" : "rounds"} included.</p></ScopeSection></div>
      </div>
      <Panel className="mt-4 px-6 py-8 sm:px-9"><h2 className="text-xl font-semibold">Record your decision</h2><p className="mt-2 text-[14.5px] leading-6 text-[#52625d]">Approve this exact version or ask the project team to revise it.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button className="min-h-[50px] text-[15px]" variant={decision === "approved" ? "primary" : "secondary"} onClick={() => setDecision("approved")}><Check size={17} /> Approve scope</Button><Button className="min-h-[50px] text-[15px]" variant={decision === "changes_requested" ? "primary" : "secondary"} onClick={() => setDecision("changes_requested")}><MessageSquareText size={17} /> Request changes</Button></div>{decision ? <div className="mt-5 grid gap-4 border-t border-line pt-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Your name"><Input value={clientName} onChange={(event) => setClientName(event.target.value)} /></Field><Field label="Your email"><Input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} /></Field></div><Field label={decision === "approved" ? "Comment (optional)" : "Changes needed"}><Textarea value={comment} onChange={(event) => setComment(event.target.value)} /></Field><div><Button variant="accent" onClick={decide} disabled={submit.isPending}><Send size={16} /> Submit decision</Button></div></div> : null}</Panel>
    </ClientPortal>
  );
}

function ScopeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="bg-white px-6 py-[26px] sm:px-9"><h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.12em] text-ink">{title}</h2>{children}</section>;
}

function ListSection({ title, items, tone = "neutral" }: { title: string; items: string[]; tone?: "neutral" | "success" | "danger" }) {
  if (!items.length) return null;
  const color = tone === "success" ? "text-[#087a55]" : tone === "danger" ? "text-[#b42318]" : "text-coral";
  return <section className="bg-white px-6 py-[26px] sm:px-9"><h2 className={`font-sans text-xs font-bold uppercase tracking-[0.12em] ${tone === "neutral" ? "text-ink" : color}`}>{title}</h2><ul className="mt-3.5 grid gap-2 text-[14.5px] leading-6 text-[#52625d]">{items.map((item) => <li key={item} className="flex gap-2.5"><span className={`font-bold ${color}`}>{tone === "danger" ? "×" : tone === "success" ? "✓" : "•"}</span>{item}</li>)}</ul></section>;
}
