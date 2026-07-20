import { post } from "./client";
import type { FileAttachment, UploadTarget } from "./types";

export async function uploadBriefFile(token: string, file: File) {
  const metadata = { filename: file.name, content_type: file.type || "text/plain", size: file.size };
  const target = await post<UploadTarget>(`/public/briefs/${token}/files/presign`, metadata);
  const response = await fetch(target.upload_url, { method: "PUT", headers: target.headers, body: file });
  if (!response.ok) throw new Error("Object storage rejected the upload");
  return post<FileAttachment>(`/public/briefs/${token}/files/confirm`, { ...metadata, storage_key: target.storage_key });
}
