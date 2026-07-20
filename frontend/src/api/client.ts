import type { AuthSession } from "./types";

const apiBase = import.meta.env.VITE_API_URL ?? "/api";
let accessToken: string | null = null;
let refreshPromise: Promise<AuthSession | null> | null = null;

export class APIError extends Error {
  status: number;
  detail: string;
  issues?: Array<{ field: string; message: string }>;

  constructor(status: number, body: unknown) {
    const value = body as { detail?: string; issues?: Array<{ field: string; message: string }> };
    super(value.detail ?? "Something went wrong");
    this.name = "APIError";
    this.status = status;
    this.detail = value.detail ?? this.message;
    this.issues = value.issues;
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/pdf")) return (await response.blob()) as T;
    return (await response.json()) as T;
  }
  let body: unknown = {};
  try {
    body = await response.json();
  } catch {
    body = { detail: response.statusText };
  }
  throw new APIError(response.status, body);
}

async function refreshAccessToken(): Promise<AuthSession | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${apiBase}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const session = (await response.json()) as AuthSession;
        setAccessToken(session.access_token);
        return session;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    const session = await refreshAccessToken();
    if (session) return api<T>(path, init, false);
  }
  return parseResponse<T>(response);
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const put = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const remove = <T>(path: string) => api<T>(path, { method: "DELETE" });

export async function download(path: string, filename: string) {
  const blob = await api<Blob>(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { refreshAccessToken };

