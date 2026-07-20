import { Dialog } from "@base-ui/react/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clipboard,
  Eye,
  FileQuestion,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { APIError, get, post, put } from "../api/client";
import type {
  BriefQuestion,
  BriefTemplate,
  ProjectBrief,
  PublicLink,
  QuestionType,
} from "../api/types";
import { Badge, Button, EmptyState, Field, Input, Panel, Select, Spinner, Textarea } from "../components/ui";

const questionTypes: Array<{ value: QuestionType; label: string }> = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "yes_no", label: "Yes or no" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "file_upload", label: "File upload" },
];

type BriefDraft = {
  name: string;
  description: string;
  category: string;
  questions: BriefQuestion[];
};

const emptyQuestion: BriefQuestion = {
  id: "",
  label: "",
  description: "",
  required: false,
  type: "short_text",
  options: [],
  order: 0,
};

export function BriefPage() {
  const { projectId } = useParams({ from: "/_app/projects/$projectId/brief" });
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [draft, setDraft] = useState<BriefDraft | null>(null);
  const [question, setQuestion] = useState<BriefQuestion>(emptyQuestion);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const templates = useQuery({
    queryKey: ["brief-templates"],
    queryFn: () => get<BriefTemplate[]>("/brief-templates"),
  });
  const brief = useQuery({
    queryKey: ["project-brief", projectId],
    queryFn: () => get<ProjectBrief>(`/projects/${projectId}/brief`),
    retry: (count, error) => !(error instanceof APIError && error.status === 404) && count < 2,
  });

  useEffect(() => {
    if (!brief.data) return;
    setDraft({
      name: brief.data.template_snapshot.name,
      description: brief.data.template_snapshot.description,
      category: brief.data.template_snapshot.category,
      questions: [...brief.data.template_snapshot.questions].sort((a, b) => a.order - b.order),
    });
  }, [brief.data]);

  const configure = useMutation({
    mutationFn: (payload: unknown) => put<ProjectBrief>(`/projects/${projectId}/brief`, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["project-brief", projectId], data);
      setDraft({
        name: data.template_snapshot.name,
        description: data.template_snapshot.description,
        category: data.template_snapshot.category,
        questions: data.template_snapshot.questions,
      });
      toast.success("Brief saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const publish = useMutation({
    mutationFn: () => post<PublicLink>(`/projects/${projectId}/brief/publish`, { expires_in_days: 14 }),
    onSuccess: (data) => {
      setPublicLink(data.url);
      void queryClient.invalidateQueries({ queryKey: ["project-brief", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Invitation sent to the client");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const selected = useMemo(
    () => templates.data?.find((template) => template.id === selectedTemplate),
    [selectedTemplate, templates.data],
  );
  const isLocked = brief.data?.status !== undefined && brief.data.status !== "draft";
  const isMissing = brief.error instanceof APIError && brief.error.status === 404;

  if (templates.isLoading || brief.isLoading) return <Spinner label="Loading brief" />;
  if (templates.error) return <EmptyState title="Templates unavailable" description={templates.error.message} />;

  const useTemplate = () => {
    if (!selected) return;
    configure.mutate({ template_id: selected.id });
  };

  const saveCustomBrief = () => {
    if (!draft) return;
    configure.mutate({
      name: draft.name,
      description: draft.description,
      category: draft.category,
      questions: draft.questions.map((item, index) => ({ ...item, order: index })),
    });
  };

  const saveQuestion = () => {
    if (!draft || question.label.trim().length < 2) {
      toast.error("Add a question label");
      return;
    }
    const choices = question.options.map((option) => option.trim()).filter(Boolean);
    if (["single_choice", "multiple_choice"].includes(question.type) && choices.length < 2) {
      toast.error("Choice questions need at least two options");
      return;
    }
    const id = editingId ?? `${question.type}-${crypto.randomUUID().slice(0, 8)}`;
    const value = {
      ...question,
      id,
      label: question.label.trim(),
      options: ["single_choice", "multiple_choice"].includes(question.type) ? choices : [],
      order: editingId
        ? draft.questions.find((item) => item.id === editingId)?.order ?? draft.questions.length
        : draft.questions.length,
    };
    setDraft({
      ...draft,
      questions: editingId
        ? draft.questions.map((item) => (item.id === editingId ? value : item))
        : [...draft.questions, value],
    });
    setQuestion(emptyQuestion);
    setEditingId(null);
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    if (!draft) return;
    const next = index + direction;
    if (next < 0 || next >= draft.questions.length) return;
    const questions = [...draft.questions];
    [questions[index], questions[next]] = [questions[next], questions[index]];
    setDraft({ ...draft, questions: questions.map((item, order) => ({ ...item, order })) });
  };

  const copyLink = async () => {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    toast.success("Client link copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">Client brief</h2>
            {brief.data ? <Badge tone={brief.data.status === "submitted" ? "success" : brief.data.status === "sent" ? "warning" : "neutral"}>{brief.data.status.replaceAll("_", " ")}</Badge> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-sage">Collect the decisions and source material needed to define the scope.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {draft ? <BriefPreview draft={draft} /> : null}
          {draft && !isLocked ? <Button variant="secondary" onClick={saveCustomBrief} disabled={configure.isPending}>Save changes</Button> : null}
          {draft && brief.data?.status !== "submitted" ? <Button onClick={() => publish.mutate()} disabled={publish.isPending}><Send size={16} /> {brief.data?.status === "sent" ? "Send new link" : "Publish brief"}</Button> : null}
        </div>
      </div>

      {publicLink ? (
        <Panel className="flex flex-col gap-4 border-forest bg-mint/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><p className="flex items-center gap-2 text-sm font-extrabold"><Check size={17} /> Client invitation is ready</p><p className="mt-1 truncate text-xs text-sage">{publicLink}</p></div>
          <Button variant="secondary" onClick={() => void copyLink()}><Clipboard size={16} /> Copy link</Button>
        </Panel>
      ) : null}

      {!draft && isMissing ? (
        <Panel className="p-6">
          <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint text-forest"><FileQuestion size={20} /></span><div><h3 className="font-extrabold">Choose a starting template</h3><p className="mt-1 text-sm leading-6 text-sage">A snapshot is saved with the project, so future template changes will not alter this brief.</p></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)} aria-label="Brief template">
              <option value="">Select a template</option>
              {templates.data?.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.category}</option>)}
            </Select>
            <Button onClick={useTemplate} disabled={!selected || configure.isPending}>Use template</Button>
          </div>
          {selected ? <div className="mt-5 border-l-2 border-coral pl-4"><p className="font-bold">{selected.name}</p><p className="mt-1 text-sm text-sage">{selected.description}</p><p className="mt-2 text-xs font-bold uppercase tracking-wide text-sage">{selected.questions.length} questions</p></div> : null}
        </Panel>
      ) : null}

      {draft ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Panel>
            <div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">Questions</h3><p className="mt-1 text-xs text-sage">Reorder and refine the client experience before publishing.</p></div>
            <div className="divide-y divide-line">
              {draft.questions.map((item, index) => (
                <div key={item.id} className="flex gap-4 px-5 py-4">
                  <span className="mt-0.5 text-xs font-extrabold text-sage">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-ink">{item.label}</p>{item.required ? <Badge tone="warning">Required</Badge> : null}</div><p className="mt-1 text-xs font-semibold text-sage">{questionTypes.find((type) => type.value === item.type)?.label}{item.options.length ? ` · ${item.options.join(", ")}` : ""}</p></div>
                  {!isLocked ? <div className="flex items-start gap-1"><Button className="min-h-8 px-2" variant="ghost" aria-label="Move question up" onClick={() => moveQuestion(index, -1)} disabled={index === 0}><ArrowUp size={15} /></Button><Button className="min-h-8 px-2" variant="ghost" aria-label="Move question down" onClick={() => moveQuestion(index, 1)} disabled={index === draft.questions.length - 1}><ArrowDown size={15} /></Button><Button className="min-h-8 px-2" variant="ghost" aria-label="Edit question" onClick={() => { setEditingId(item.id); setQuestion(item); }}><Pencil size={15} /></Button><Button className="min-h-8 px-2 text-red-700" variant="ghost" aria-label="Delete question" onClick={() => setDraft({ ...draft, questions: draft.questions.filter((candidate) => candidate.id !== item.id) })}><Trash2 size={15} /></Button></div> : null}
                </div>
              ))}
            </div>
          </Panel>

          {!isLocked ? (
            <Panel className="h-fit p-5">
              <div className="flex items-center justify-between"><h3 className="font-extrabold">{editingId ? "Edit question" : "Add question"}</h3>{editingId ? <Button className="min-h-8 px-2" variant="ghost" onClick={() => { setEditingId(null); setQuestion(emptyQuestion); }} aria-label="Cancel editing"><X size={16} /></Button> : null}</div>
              <div className="mt-5 grid gap-4">
                <Field label="Question"><Input value={question.label} onChange={(event) => setQuestion({ ...question, label: event.target.value })} placeholder="What does success look like?" /></Field>
                <Field label="Description"><Textarea className="min-h-20" value={question.description} onChange={(event) => setQuestion({ ...question, description: event.target.value })} placeholder="Optional context for the client" /></Field>
                <Field label="Answer type"><Select value={question.type} onChange={(event) => setQuestion({ ...question, type: event.target.value as QuestionType, options: [] })}>{questionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</Select></Field>
                {["single_choice", "multiple_choice"].includes(question.type) ? <Field label="Options" hint="One option per line"><Textarea className="min-h-24" value={question.options.join("\n")} onChange={(event) => setQuestion({ ...question, options: event.target.value.split("\n") })} /></Field> : null}
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-forest" checked={question.required} onChange={(event) => setQuestion({ ...question, required: event.target.checked })} /> Required answer</label>
                <Button onClick={saveQuestion}><Plus size={16} /> {editingId ? "Update question" : "Add question"}</Button>
              </div>
            </Panel>
          ) : (
            <Panel className="h-fit p-5"><h3 className="font-extrabold">Brief locked</h3><p className="mt-2 text-sm leading-6 text-sage">Published briefs preserve exactly what the client received. Send a new secure link if the current one has expired.</p></Panel>
          )}
        </div>
      ) : null}
    </div>
  );
}

function BriefPreview({ draft }: { draft: BriefDraft }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant="secondary" />}><Eye size={16} /> Preview</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/45" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(44rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-paper p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-coral">Client preview</p><Dialog.Title className="mt-2 text-2xl font-extrabold">{draft.name}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-sage">{draft.description}</Dialog.Description></div><Dialog.Close render={<Button className="min-h-9 px-2" variant="ghost" aria-label="Close preview" />}><X size={18} /></Dialog.Close></div>
          <div className="mt-7 grid gap-5">{draft.questions.map((item, index) => <div key={item.id}><p className="text-sm font-extrabold"><span className="mr-2 text-coral">{index + 1}.</span>{item.label}{item.required ? <span className="ml-1 text-coral">*</span> : null}</p>{item.description ? <p className="mt-1 text-xs text-sage">{item.description}</p> : null}<PreviewControl question={item} /></div>)}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PreviewControl({ question }: { question: BriefQuestion }) {
  if (question.type === "long_text") return <Textarea className="mt-2" disabled placeholder="Client response" />;
  if (question.type === "single_choice" || question.type === "multiple_choice") return <div className="mt-2 grid gap-2">{question.options.map((option) => <label key={option} className="flex items-center gap-2 text-sm text-sage"><input type={question.type === "single_choice" ? "radio" : "checkbox"} disabled /> {option}</label>)}</div>;
  if (question.type === "yes_no") return <div className="mt-2 flex gap-2"><Button variant="secondary" disabled>Yes</Button><Button variant="secondary" disabled>No</Button></div>;
  if (question.type === "file_upload") return <div className="mt-2 border border-dashed border-line bg-white p-4 text-center text-xs font-bold text-sage">Choose files</div>;
  return <Input className="mt-2" disabled type={question.type === "date" ? "date" : question.type === "number" ? "number" : "text"} placeholder="Client response" />;
}
