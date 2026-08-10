import { apiDelete, apiGet, apiGetPaged, apiPost, apiPut } from "@/lib/api-client";

export const GENDERS = ["Male", "Female"] as const;
export type Gender = (typeof GENDERS)[number];

/** A fixed set rather than free text, because the customers list filters on it. */
export const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Other"] as const;
export type Religion = (typeof RELIGIONS)[number];

export type Customer = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  gender: Gender | null;
  religion: Religion | null;
  /** yyyy-MM-dd — a date with no time, as the API sends it. */
  dateOfBirth: string | null;
  weddingDate: string | null;
  createdAtUtc: string;
};

export type CustomerInput = {
  fullName: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  gender: Gender | null;
  religion: Religion | null;
  dateOfBirth: string | null;
  weddingDate: string | null;
};

export function searchCustomers(
  search: string,
  page: number,
  pageSize: number,
  token: string | null,
  religion: Religion | null = null,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) {
    params.set("search", search);
  }
  if (religion) {
    params.set("religion", religion);
  }
  return apiGetPaged<Customer>(`/api/v1/customers?${params}`, token);
}

export function getCustomer(id: string, token: string | null) {
  return apiGet<Customer>(`/api/v1/customers/${id}`, token);
}

export function createCustomer(input: CustomerInput, token: string | null) {
  return apiPost<Customer>("/api/v1/customers", input, token);
}

export function updateCustomer(id: string, input: CustomerInput, token: string | null) {
  return apiPut<Customer>(`/api/v1/customers/${id}`, input, token);
}

export function deleteCustomer(id: string, token: string | null) {
  return apiDelete(`/api/v1/customers/${id}`, token);
}
