import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { CalendarDays, FileUp, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { get, post } from "../api/client";
import type { BriefQuestion, PublicBrief } from "../api/types";
import { uploadBriefFile } from "../api/uploads";
import { ClientConfirmation, ClientPortal } from "../components/ClientPortal";
import { Button, Field, Input, Panel, Spinner, Textarea } from "../components/ui";
import { shortDate } from "../lib/format";

export function PublicBriefPage() {
  const { token } = useParams({ from: "/client/brief/$token" });
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [completed, setCompleted] = useState(false);
  const brief = useQuery({ queryKey: ["public-brief", token], queryFn: () => get<PublicBrief>(`/public/briefs/${token}`) });
  const submit = useMutation({
    mutationFn: () => post<{ message: string }>(`/public/briefs/${token}/submit`, { answers }),
    onSuccess: () => setCompleted(true),
    onError: (error: Error) => toast.error(error.message),
  });

  if (completed) return <ClientConfirmation title="Brief submitted" description="Thank you. Your answers and files have been sent to the project team. They can now prepare a precise scope for your review." />;
  if (brief.isLoading) return <ClientPortal><Spinner label="Opening your brief" /></ClientPortal>;
  if (brief.error || !brief.data) return <ClientPortal><PortalError message={brief.error?.message ?? "This link is no longer available."} /></ClientPortal>;
  if (brief.data.submitted) return <ClientConfirmation title="Brief already submitted" description="Your project team has received the answers. You can close this page." />;

  const update = (id: string, value: unknown) => setAnswers((current) => ({ ...current, [id]: value }));
  const send = () => {
    const missing = brief.data.questions.find((question) => question.required && isEmpty(answers[question.id]));
    if (missing) {
      toast.error(`Please answer “${missing.label}”`);
      return;
    }
    submit.mutate();
  };

  return (
    <ClientPortal>
      <header className="border border-line bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-coral">Project brief</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{brief.data.project_name}</h1><p className="mt-3 text-sm leading-6 text-sage">Hi {brief.data.client_name}, {brief.data.brief_description}</p>{brief.data.target_delivery_date ? <p className="mt-5 flex items-center gap-2 text-xs font-bold text-sage"><CalendarDays size={15} /> Target delivery {shortDate(brief.data.target_delivery_date)}</p> : null}</header>
      <Panel className="mt-5 p-5 sm:p-8"><div className="grid gap-7">{brief.data.questions.map((question, index) => <QuestionField key={question.id} token={token} question={question} index={index} value={answers[question.id]} onChange={(value) => update(question.id, value)} />)}</div><div className="mt-8 border-t border-line pt-6"><Button className="w-full sm:w-auto" onClick={send} disabled={submit.isPending}><Send size={16} /> {submit.isPending ? "Submitting" : "Submit brief"}</Button><p className="mt-3 text-xs leading-5 text-sage">You can review every answer before submitting. After submission, the secure link closes.</p></div></Panel>
    </ClientPortal>
  );
}

function QuestionField({ token, question, index, value, onChange }: { token: string; question: BriefQuestion; index: number; value: unknown; onChange: (value: unknown) => void }) {
  const upload = useMutation({
    mutationFn: (file: File) => uploadBriefFile(token, file),
    onSuccess: (file) => {
      const current: string[] = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
      onChange([...current, file.id]);
      toast.success(`${file.original_filename} uploaded`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const label = `${index + 1}. ${question.label}${question.required ? " *" : ""}`;
  if (question.type === "long_text") return <Field label={label} hint={question.description}><Textarea value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} /></Field>;
  if (question.type === "single_choice") return <ChoiceField label={label} description={question.description} options={question.options} multiple={false} value={value} onChange={onChange} />;
  if (question.type === "multiple_choice") return <ChoiceField label={label} description={question.description} options={question.options} multiple value={value} onChange={onChange} />;
  if (question.type === "yes_no") return <fieldset><legend className="text-sm font-semibold">{label}</legend>{question.description ? <p className="mt-1 text-xs text-sage">{question.description}</p> : null}<div className="mt-3 flex gap-2"><Button variant={value === true ? "primary" : "secondary"} onClick={() => onChange(true)}>Yes</Button><Button variant={value === false ? "primary" : "secondary"} onClick={() => onChange(false)}>No</Button></div></fieldset>;
  if (question.type === "file_upload") return <div><p className="text-sm font-semibold">{label}</p>{question.description ? <p className="mt-1 text-xs text-sage">{question.description}</p> : null}<label className="focus-within:focus-ring mt-2 flex min-h-24 cursor-pointer items-center justify-center gap-2 border border-dashed border-line bg-paper text-sm font-bold text-sage hover:border-sage"><FileUp size={18} /> {upload.isPending ? "Uploading" : Array.isArray(value) && value.length ? `${value.length} file uploaded` : "Choose a file"}<input className="sr-only" type="file" accept=".pdf,.docx,.xlsx,.zip,.jpg,.jpeg,.png,.webp,.csv,.txt" disabled={upload.isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate(file); }} /></label></div>;
  return <Field label={label} hint={question.description}><Input type={question.type === "date" ? "date" : question.type === "number" ? "number" : "text"} value={typeof value === "string" || typeof value === "number" ? value : ""} onChange={(event) => onChange(question.type === "number" ? Number(event.target.value) : event.target.value)} /></Field>;
}

function ChoiceField({ label, description, options, multiple, value, onChange }: { label: string; description: string; options: string[]; multiple: boolean; value: unknown; onChange: (value: unknown) => void }) {
  const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return <fieldset><legend className="text-sm font-semibold">{label}</legend>{description ? <p className="mt-1 text-xs text-sage">{description}</p> : null}<div className="mt-3 grid gap-2">{options.map((option) => <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3 border border-line bg-paper px-3 text-sm font-semibold"><input className="size-4 accent-forest" type={multiple ? "checkbox" : "radio"} name={label} checked={multiple ? selected.includes(option) : value === option} onChange={(event) => onChange(multiple ? event.target.checked ? [...selected, option] : selected.filter((item) => item !== option) : option)} />{option}</label>)}</div></fieldset>;
}

function PortalError({ message }: { message: string }) {
  return <div className="grid min-h-80 place-items-center border border-line bg-white p-8 text-center"><div><h1 className="text-2xl font-extrabold">Link unavailable</h1><p className="mt-3 text-sm leading-6 text-sage">{message}</p><p className="mt-2 text-sm text-sage">Ask the project team for a new secure link.</p></div></div>;
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}
