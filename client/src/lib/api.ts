export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiEnvelope<T> = { data: T };

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = sessionStorage.getItem("bookleaf_access_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });
  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { error?: { message?: string; code?: string } }
    | null;

  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event("bookleaf:auth-expired"));
    const error = payload && "error" in payload ? payload.error : undefined;
    throw new ApiError(error?.message ?? "Something went wrong. Please try again.", response.status, error?.code);
  }

  if (!payload || !("data" in payload)) throw new ApiError("The server returned an invalid response.", response.status);
  return payload.data;
}

export async function downloadFile(path: string, filename: string) {
  const token = sessionStorage.getItem("bookleaf_access_token");
  const response = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event("bookleaf:auth-expired"));
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new ApiError(payload?.error?.message ?? "The attachment could not be downloaded.", response.status);
  }

  const blobUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
