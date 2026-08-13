import { apiDelete, apiGet, apiGetPaged, apiPost, apiPut } from "@/lib/api-client";

export type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  jobTitle: string | null;
  phoneNumber: string | null;
  email: string | null;
  createdAtUtc: string;
};

export type EmployeeInput = {
  employeeCode: string;
  fullName: string;
  jobTitle: string | null;
  phoneNumber: string | null;
  email: string | null;
};

export function searchEmployees(search: string, page: number, pageSize: number, token: string | null) {
  // Search matches name, employee code or phone — the three things staff know a colleague by.
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) {
    params.set("search", search);
  }
  return apiGetPaged<Employee>(`/api/v1/employees?${params}`, token);
}

export function getEmployee(id: string, token: string | null) {
  return apiGet<Employee>(`/api/v1/employees/${id}`, token);
}

export function createEmployee(input: EmployeeInput, token: string | null) {
  return apiPost<Employee>("/api/v1/employees", input, token);
}

export function updateEmployee(id: string, input: EmployeeInput, token: string | null) {
  return apiPut<Employee>(`/api/v1/employees/${id}`, input, token);
}

export function deleteEmployee(id: string, token: string | null) {
  return apiDelete(`/api/v1/employees/${id}`, token);
}
