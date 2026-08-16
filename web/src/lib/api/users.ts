import { apiDelete, apiGet, apiGetPaged, apiPost, apiPostNoContent, apiPut, apiPutNoContent } from "@/lib/api-client";
import type { AuthTokens } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email: string | null;
  /** Null on an account created before names were recorded — show displayNameOf, not this. */
  fullName: string | null;
  roles: string[];
  /** Resolved server-side from the roles, so the client never has to know the mapping. */
  permissions: string[];
};

export type AppUser = { id: string; email: string; fullName: string | null; role: string | null };

/**
 * What to call someone on screen: their name, or the email they sign in with where there is none.
 *
 * Accounts that existed before names were recorded have none, and nobody can invent one for them.
 * Falling back to the email means those read exactly as they did before rather than as a blank.
 */
export function displayNameOf(user: { fullName: string | null; email: string | null }): string {
  return user.fullName?.trim() || user.email || "";
}

/**
 * Mirrors Permissions.cs. Kept as strings so a permission added server-side needs no client change
 * to be enforced.
 *
 * One entry per individual action, matching what the server now demands: a role can be allowed to
 * add a customer without being allowed to delete one, so a screen asking "can they manage
 * customers" could no longer answer the question a button needs answered. The `Manage` umbrellas
 * still exist server-side — they are what the built-in roles are written in terms of, and holding
 * one grants every action beneath it — but nothing here should check for them.
 */
export const PERMISSIONS = {
  customersView: "Customers.View",
  customersCreate: "Customers.Create",
  customersEdit: "Customers.Edit",
  customersDelete: "Customers.Delete",
  measurementsView: "Measurements.View",
  employeesView: "Employees.View",
  employeesCreate: "Employees.Create",
  employeesEdit: "Employees.Edit",
  employeesRetire: "Employees.Retire",
  ordersView: "Orders.View",
  ordersCreate: "Orders.Create",
  ordersEdit: "Orders.Edit",
  invoicesView: "Invoices.View",
  invoicesCreate: "Invoices.Create",
  whatsAppView: "WhatsApp.View",
  reportsView: "Reports.View",
  pricingView: "Pricing.View",
  inventoryView: "Inventory.View",
  inventoryCreate: "Inventory.Create",
  settingsView: "Settings.View",
  activityView: "Activity.View",
  usersView: "Users.View",
  usersCreate: "Users.Create",
  usersEdit: "Users.Edit",
  usersPassword: "Users.Password",
  usersRights: "Users.Rights",
  usersRoles: "Users.Roles",
} as const;

export function getCurrentUser(token: string | null) {
  return apiGet<CurrentUser>("/api/v1/users/me", token);
}

export function listUsers(page: number, pageSize: number, token: string | null) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiGetPaged<AppUser>(`/api/v1/users?${params}`, token);
}

/** Just the names, in the order the dropdowns should offer them. Needs only Users.View. */
export function listRoles(token: string | null) {
  return apiGet<string[]>("/api/v1/users/roles", token);
}

/**
 * One assignable role.
 *
 * @property isBuiltIn Shipped with the system: its rights can be changed, its name cannot, and it cannot be removed.
 * @property userCount How many people hold it — a role in use cannot be deleted.
 */
export type AppRole = { id: string; name: string; isBuiltIn: boolean; userCount: number };

export function listRoleDetails(token: string | null) {
  return apiGet<AppRole[]>("/api/v1/users/roles/details", token);
}

export function createRole(name: string, token: string | null) {
  return apiPost<AppRole>("/api/v1/users/roles", { name }, token);
}

export function renameRole(id: string, name: string, token: string | null) {
  return apiPut<AppRole>(`/api/v1/users/roles/${id}`, { name }, token);
}

export function deleteRole(id: string, token: string | null) {
  return apiDelete(`/api/v1/users/roles/${id}`, token);
}

/** Signs the user out everywhere as well as changing the password — see the API's ResetPassword. */
export function resetUserPassword(id: string, newPassword: string, token: string | null) {
  return apiPostNoContent(`/api/v1/users/${id}/password`, { newPassword }, token);
}

export function createUser(email: string, password: string, fullName: string, role: string, token: string | null) {
  return apiPost<AppUser>("/api/v1/users", { email, password, fullName, role }, token);
}

/** The API answers 204 here, so this must not go through apiPut — see apiPutNoContent. */
export function setUserRole(id: string, role: string, token: string | null) {
  return apiPutNoContent(`/api/v1/users/${id}/role`, { role }, token);
}

/** Renames a person. Their email is how they sign in and is not touched. Answers 204, like setUserRole. */
export function setUserName(id: string, fullName: string, token: string | null) {
  return apiPutNoContent(`/api/v1/users/${id}`, { fullName }, token);
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
