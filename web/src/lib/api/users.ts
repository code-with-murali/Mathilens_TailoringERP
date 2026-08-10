import { apiGet, apiPost, apiPut } from "@/lib/api-client";

export type CurrentUser = {
  id: string;
  email: string | null;
  roles: string[];
  /** Resolved server-side from the roles, so the client never has to know the mapping. */
  permissions: string[];
};

export type AppUser = { id: string; email: string; role: string | null };

/** Mirrors Permissions.cs. Kept as strings so a permission added server-side needs no client change to be enforced. */
export const PERMISSIONS = {
  customersView: "Customers.View",
  customersManage: "Customers.Manage",
  measurementsView: "Measurements.View",
  employeesView: "Employees.View",
  employeesManage: "Employees.Manage",
  ordersView: "Orders.View",
  ordersManage: "Orders.Manage",
  invoicesView: "Invoices.View",
  invoicesManage: "Invoices.Manage",
  whatsAppView: "WhatsApp.View",
  reportsView: "Reports.View",
  pricingView: "Pricing.View",
  settingsView: "Settings.View",
  activityView: "Activity.View",
  usersView: "Users.View",
  usersManage: "Users.Manage",
} as const;

export function getCurrentUser(token: string | null) {
  return apiGet<CurrentUser>("/api/v1/users/me", token);
}

export function listUsers(token: string | null) {
  return apiGet<AppUser[]>("/api/v1/users", token);
}

export function listRoles(token: string | null) {
  return apiGet<string[]>("/api/v1/users/roles", token);
}

export function createUser(email: string, password: string, role: string, token: string | null) {
  return apiPost<AppUser>("/api/v1/users", { email, password, role }, token);
}

export function setUserRole(id: string, role: string, token: string | null) {
  return apiPut<void>(`/api/v1/users/${id}/role`, { role }, token);
}
