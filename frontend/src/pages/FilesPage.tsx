import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Download, File, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { get, post, remove } from "../api/client";
import type { DownloadTarget, FileAttachment, UploadTarget } from "../api/types";
import { Button, EmptyState, Panel, Spinner } from "../components/ui";
import { shortDate } from "../lib/format";

const acceptedTypes = ".pdf,.docx,.xlsx,.zip,.jpg,.jpeg,.png,.webp,.csv,.txt";

export function FilesPage() {
  const { projectId } = useParams({ from: "/_app/projects/$projectId/files" });
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const files = useQuery({ queryKey: ["project-files", projectId], queryFn: () => get<FileAttachment[]>(`/projects/${projectId}/files`) });
  const upload = useMutation({
    mutationFn: async (file: globalThis.File) => {
      const metadata = { filename: file.name, content_type: file.type || "text/plain", size: file.size };
      const target = await post<UploadTarget>(`/projects/${projectId}/files/presign`, metadata);
      const response = await fetch(target.upload_url, { method: "PUT", headers: target.headers, body: file });
      if (!response.ok) throw new Error("Object storage rejected the upload");
      return post<FileAttachment>(`/projects/${projectId}/files/confirm`, { ...metadata, storage_key: target.storage_key });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["activity", projectId] });
      toast.success("File uploaded");
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteFile = useMutation({
    mutationFn: (id: string) => remove<{ message: string }>(`/projects/${projectId}/files/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project-files", projectId] });
      toast.success("File deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openDownload = async (id: string) => {
    try {
      const target = await get<DownloadTarget>(`/projects/${projectId}/files/${id}/download`);
      window.open(target.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    }
  };

  if (files.isLoading) return <Spinner label="Loading files" />;
  if (files.error) return <EmptyState title="Files unavailable" description={files.error.message} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h2 className="text-[22px] font-semibold">Files</h2><p className="mt-1.5 text-[14.5px] leading-6 text-[#52625d]">Keep client source material and project documents attached to the right project.</p></div><div><input ref={inputRef} className="sr-only" type="file" accept={acceptedTypes} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate(file); }} /><Button variant="accent" onClick={() => inputRef.current?.click()} disabled={upload.isPending}><Upload size={16} /> {upload.isPending ? "Uploading" : "Upload file"}</Button></div></div>
      {files.data?.length ? <Panel><div className="divide-y divide-line">{files.data.map((item) => <div key={item.id} className="grid grid-cols-[48px_1fr_auto_auto] items-center gap-4 px-6 py-4"><span className="grid size-11 shrink-0 place-items-center bg-mint text-[11px] font-bold text-forest"><File size={18} /></span><div className="min-w-0"><p className="truncate text-[14.5px] font-bold">{item.original_filename}</p><p className="mt-1 text-[13px] text-sage">{formatBytes(item.size)} · {shortDate(item.created_at)}</p></div><Button className="min-h-9" variant="secondary" aria-label={`Download ${item.original_filename}`} onClick={() => void openDownload(item.id)}><Download size={15} /> Download</Button><Button className="min-h-9 px-2 text-red-700" variant="ghost" aria-label={`Delete ${item.original_filename}`} onClick={() => deleteFile.mutate(item.id)} disabled={deleteFile.isPending}><Trash2 size={15} /> <span className="hidden sm:inline">Delete</span></Button></div>)}</div></Panel> : <EmptyState title="No files yet" description="Upload a project document, or invite the client to attach files while completing the brief." action={<Button variant="secondary" onClick={() => inputRef.current?.click()}>Choose file</Button>} />}
      <p className="text-xs leading-5 text-sage">PDF, Office documents, ZIP, common images, CSV, and text files are supported. The server validates type and size before confirmation.</p>
    </div>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
