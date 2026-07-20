import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Check, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { get, post } from "../api/client";
import type { PublicChangeRequest } from "../api/types";
import { ClientConfirmation, ClientPortal, ClientPortalError } from "../components/ClientPortal";
import { Badge, Button, Field, Input, Panel, Spinner, Textarea } from "../components/ui";
import { money } from "../lib/format";

export function PublicChangeRequestPage() {
  const { token } = useParams({ from: "/client/change-request/$token" });
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [clientName, setClientName] = useState("");
  const [comment, setComment] = useState("");
  const [completed, setCompleted] = useState<boolean | null>(null);
  const request = useQuery({ queryKey: ["public-change", token], queryFn: () => get<PublicChangeRequest>(`/public/change-requests/${token}`) });
  const submit = useMutation({
    mutationFn: () => post<{ message: string }>(`/public/change-requests/${token}/decision`, { accepted, client_name: clientName, comment: comment || null }),
    onSuccess: () => setCompleted(accepted),
    onError: (error: Error) => toast.error(error.message),
  });

  if (completed !== null) return <ClientConfirmation title={completed ? "Change accepted" : "Change declined"} description={completed ? "Your decision is recorded. The project price and target delivery date will be updated with this additional work." : "Your decision and optional comment were sent to the project team."} />;
  if (request.isLoading) return <ClientPortal><Spinner label="Opening change request" /></ClientPortal>;
  if (request.error || !request.data) return <ClientPortal><ClientPortalError message={request.error?.message ?? "This link is no longer available."} /></ClientPortal>;
  const change = request.data.change_request;

  const decide = () => {
    if (accepted === null) return;
    if (clientName.trim().length < 2) {
      toast.error("Enter your name");
      return;
    }
    submit.mutate();
  };

  return (
    <ClientPortal>
      <header className="border border-line bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-coral">Change request</p><Badge tone="warning">Decision needed</Badge></div><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{change.title}</h1><p className="mt-2 text-sm font-bold text-sage">{request.data.project_name}</p><div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5"><div><p className="text-xs font-bold text-sage">Additional price</p><p className="mt-1 text-xl font-extrabold">+{money(change.additional_price, request.data.currency)}</p></div><div><p className="text-xs font-bold text-sage">Schedule impact</p><p className="mt-1 text-xl font-extrabold">+{change.additional_days} days</p></div></div></header>
      <Panel className="mt-5 divide-y divide-line"><section className="p-5 sm:p-7"><h2 className="text-sm font-extrabold uppercase tracking-[0.1em]">Requested work</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-sage">{change.description}</p></section><section className="p-5 sm:p-7"><h2 className="text-sm font-extrabold uppercase tracking-[0.1em]">Why this is a change</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-sage">{change.reason}</p></section></Panel>
      <Panel className="mt-5 p-5 sm:p-8"><h2 className="text-xl font-extrabold">Your decision</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button className="min-h-12" variant={accepted === true ? "primary" : "secondary"} onClick={() => setAccepted(true)}><Check size={17} /> Accept change</Button><Button className="min-h-12" variant={accepted === false ? "danger" : "secondary"} onClick={() => setAccepted(false)}><X size={17} /> Decline change</Button></div>{accepted !== null ? <div className="mt-6 grid gap-4 border-t border-line pt-6"><Field label="Your name"><Input value={clientName} onChange={(event) => setClientName(event.target.value)} /></Field><Field label="Comment (optional)"><Textarea value={comment} onChange={(event) => setComment(event.target.value)} /></Field><div><Button onClick={decide} disabled={submit.isPending}><Send size={16} /> Submit decision</Button></div></div> : null}</Panel>
    </ClientPortal>
  );
}
