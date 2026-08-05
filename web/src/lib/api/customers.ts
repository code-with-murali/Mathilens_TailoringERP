import { apiDelete, apiGet, apiGetPaged, apiPost, apiPut } from "@/lib/api-client";

export type Customer = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAtUtc: string;
};

export type CustomerInput = {
  fullName: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export function searchCustomers(search: string, page: number, pageSize: number, token: string | null) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) {
    params.set("search", search);
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
