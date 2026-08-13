import { apiDelete, apiGet, apiGetPaged, apiPost, apiPostNoContent, apiPut } from "@/lib/api-client";
import type { AuthTokens } from "@/lib/auth";

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
  inventoryView: "Inventory.View",
  inventoryManage: "Inventory.Manage",
  settingsView: "Settings.View",
  activityView: "Activity.View",
  usersView: "Users.View",
  usersManage: "Users.Manage",
} as const;

export function getCurrentUser(token: string | null) {
  return apiGet<CurrentUser>("/api/v1/users/me", token);
}

export function listUsers(page: number, pageSize: number, token: string | null) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiGetPaged<AppUser>(`/api/v1/users?${params}`, token);
}

export function listRoles(token: string | null) {
  return apiGet<string[]>("/api/v1/users/roles", token);
}

/** Signs the user out everywhere as well as changing the password — see the API's ResetPassword. */
export function resetUserPassword(id: string, newPassword: string, token: string | null) {
  return apiPostNoContent(`/api/v1/users/${id}/password`, { newPassword }, token);
}

export function createUser(email: string, password: string, role: string, token: string | null) {
  return apiPost<AppUser>("/api/v1/users", { email, password, role }, token);
}

export function setUserRole(id: string, role: string, token: string | null) {
  return apiPut<void>(`/api/v1/users/${id}/role`, { role }, token);
}

/** One screen and the actions it defines — some screens are view-only and offer no Manage. */
export type ScreenPermissions = { screen: string; permissions: { permission: string; action: string }[] };

export type RolePermissions = {
  role: string;
  permissions: string[];
  /** False for Owner, which always holds everything and cannot be edited. */
  isEditable: boolean;
  /** False while the role still matches its built-in set. */
  isCustomised: boolean;
};

export type RolePermissionMatrix = { screens: ScreenPermissions[]; roles: RolePermissions[] };

export function getRolePermissions(token: string | null) {
  return apiGet<RolePermissionMatrix>("/api/v1/users/role-permissions", token);
}

export function setRolePermissions(role: string, permissions: string[], token: string | null) {
  return apiPut<RolePermissions>(`/api/v1/users/role-permissions/${role}`, { permissions }, token);
}

export function resetRolePermissions(role: string, token: string | null) {
  return apiDelete(`/api/v1/users/role-permissions/${role}`, token);
}

/** The plaintext code and when it stops working. Returned once at issue and never retrievable again. */
export type PasswordResetCode = { code: string; expiresAtUtc: string };

/**
 * Issues a one-time code for the user to redeem themselves.
 *
 * Preferred over resetUserPassword: the Owner hands the code over in person and never learns the
 * password that gets set. Their sessions end immediately, not when the code is used.
 */
export function issueResetCode(userId: string, token: string | null) {
  return apiPost<PasswordResetCode>(`/api/v1/users/${userId}/reset-code`, {}, token);
}

/** Changes the caller's own password. Returns a fresh token pair so the current screen keeps working. */
export function changeOwnPassword(currentPassword: string, newPassword: string, token: string | null) {
  return apiPost<AuthTokens>("/api/v1/users/me/password", { currentPassword, newPassword }, token);
}
