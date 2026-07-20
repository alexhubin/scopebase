import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Check, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { get, post } from "../api/client";
import type { PublicChangeRequest } from "../api/types";
import { ClientConfirmation, ClientPortal, ClientPortalError } from "../components/ClientPortal";
import { Badge, Button, Field, Input, Panel, Spinner } from "../components/ui";
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
      <div className="border border-line bg-white"><header className="border-b border-line px-6 py-8 sm:px-9"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">Change request</p><Badge tone="warning">Decision needed</Badge></div><h1 className="mt-3 text-[28px] font-semibold tracking-[-0.02em]">{change.title}</h1><p className="mt-2 text-sm text-[#52625d]">{request.data.project_name} · approved scope</p></header><div className="grid grid-cols-2 gap-px border-b border-line bg-line"><div className="bg-white px-6 py-[18px] sm:px-9"><p className="text-[12.5px] text-sage">Additional price</p><p className="mt-1 font-display text-2xl font-semibold text-coral">+{money(change.additional_price, request.data.currency)}</p></div><div className="bg-white px-6 py-[18px] sm:px-9"><p className="text-[12.5px] text-sage">Schedule impact</p><p className="mt-1 font-display text-2xl font-semibold">+{change.additional_days} days</p></div></div><section className="border-b border-[#eceee9] px-6 py-[26px] sm:px-9"><h2 className="font-sans text-xs font-bold uppercase tracking-[0.12em]">Requested work</h2><p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.7] text-[#52625d]">{change.description}</p></section><section className="px-6 py-[26px] sm:px-9"><h2 className="font-sans text-xs font-bold uppercase tracking-[0.12em]">Why this is a change</h2><p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.7] text-[#52625d]">{change.reason}</p></section></div>
      <Panel className="mt-4 px-6 py-8 sm:px-9"><h2 className="text-xl font-semibold">Your decision</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button className="min-h-[50px] text-[15px]" variant={accepted === true ? "primary" : "secondary"} onClick={() => setAccepted(true)}><Check size={17} /> Accept change</Button><Button className="min-h-[50px] text-[15px]" variant={accepted === false ? "danger" : "secondary"} onClick={() => setAccepted(false)}><X size={17} /> Decline change</Button></div>{accepted !== null ? <div className="mt-5 grid gap-4 border-t border-line pt-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Your name"><Input value={clientName} onChange={(event) => setClientName(event.target.value)} /></Field><Field label="Comment (optional)"><Input value={comment} onChange={(event) => setComment(event.target.value)} /></Field></div><div><Button variant="accent" onClick={decide} disabled={submit.isPending}><Send size={16} /> Submit decision</Button></div></div> : null}</Panel>
    </ClientPortal>
  );
}
