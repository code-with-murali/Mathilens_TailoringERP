/**
 * Thin fetch wrapper matching the backend's response envelope
 * (00_MASTER_SPEC.md § 8.6-8.7). The API base URL is configuration-driven
 * (NEXT_PUBLIC_API_BASE_URL), never hardcoded per environment.
 */

export type ApiFieldError = {
  field: string;
  message: string;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      errorBody?.error?.code ?? "UNKNOWN_ERROR",
      errorBody?.error?.message ?? "An unexpected error occurred.",
      errorBody?.error?.details ?? null,
    );
  }

  return (body as ApiSuccessResponse<T>).data;
}

export function apiGet<T>(path: string, token?: string | null): Promise<T> {
  return request<T>(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export function apiPost<T>(path: string, payload: unknown, token?: string | null): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
