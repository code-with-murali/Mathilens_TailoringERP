/**
 * Thin fetch wrapper matching the backend's response envelope
 * (00_MASTER_SPEC.md § 8.6-8.7). The API base URL is configuration-driven
 * (NEXT_PUBLIC_API_BASE_URL), never hardcoded per environment.
 */

export type ApiFieldError = {
  field: string;
  message: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: unknown;
};

type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details: ApiFieldError[] | null;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiFieldError[] | null;

  constructor(status: number, code: string, message: string, details: ApiFieldError[] | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5232";

function authHeaders(token?: string | null): HeadersInit | undefined {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

async function throwIfError(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  const body = await response.json().catch(() => null);
  const errorBody = body as ApiErrorBody | null;
  throw new ApiError(
    response.status,
    errorBody?.error?.code ?? "UNKNOWN_ERROR",
    errorBody?.error?.message ?? "An unexpected error occurred.",
    errorBody?.error?.details ?? null,
  );
}

async function requestEnvelope<T>(path: string, init?: RequestInit): Promise<ApiSuccessResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  await throwIfError(response);

  return (await response.json()) as ApiSuccessResponse<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const envelope = await requestEnvelope<T>(path, init);
  return envelope.data;
}

export function apiGet<T>(path: string, token?: string | null): Promise<T> {
  return request<T>(path, { headers: authHeaders(token) });
}

/** For paginated collection endpoints (00_MASTER_SPEC.md § 8.3) — surfaces `meta` alongside the items. */
export async function apiGetPaged<T>(path: string, token?: string | null): Promise<{ items: T[]; meta: PaginationMeta }> {
  const envelope = await requestEnvelope<T[]>(path, { headers: authHeaders(token) });
  return { items: envelope.data, meta: envelope.meta as PaginationMeta };
}

export function apiPost<T>(path: string, payload: unknown, token?: string | null): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export function apiPut<T>(path: string, payload: unknown, token?: string | null): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: authHeaders(token),
  });
}

/** For endpoints that return 204 No Content on success — never attempts to parse a body. */
export async function apiDelete(path: string, token?: string | null): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  await throwIfError(response);
}

/** For POST endpoints (typically actions, not resource creation) that return 204 No Content on success — never attempts to parse a body. */
export async function apiPostNoContent(path: string, payload: unknown, token?: string | null): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
  });

  await throwIfError(response);
}
