"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, ModalActions } from "@/components/ui/Modal";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";
import {
  listUsers,
  listRoles,
  createUser,
  setUserRole,
  setUserName,
  resetUserPassword,
  PERMISSIONS,
  type AppUser,
} from "@/lib/api/users";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/**
 * The role that runs the shop. It is the only one that can hand out access, so its holders are not
 * demotable from this screen — the server refuses to remove the last one anyway, and finding that
 * out after pressing Submit is a worse way to learn it.
 */
const OWNER_ROLE = "Owner";

/**
 * Plain-language descriptions, because "Manager" alone doesn't tell an owner what they're handing
 * over. Only the four built-in roles have one — a role the shop invented is described by the
 * rights it was given on User Rights, which is the only place that knows.
 */
const ROLE_SUMMARY: Record<string, string> = {
  Owner: "Everything, including managing users and access.",
  Manager: "Everything operational — staff, pricing, reports and settings. Cannot change who has access.",
  FrontDesk: "Customers, measurements, orders, billing and WhatsApp. No staff records or configuration.",
  Tailor: "Sees customers and measurements; works the orders. No billing, no configuration.",
};

export default function UsersPage() {
  const { showToast } = useToast();
  const { can, isLoaded } = usePermissions();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // The user being edited, and the name and role picked for them. Held here rather than per row,
  // because the fields now live in a dialog instead of in the grid.
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Resetting targets one user at a time; holding the user here doubles as "the dialog is open".
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const canCreate = can(PERMISSIONS.usersCreate);
  const canEdit = can(PERMISSIONS.usersEdit);
  const canSetPassword = can(PERMISSIONS.usersPassword);
  const hasRowActions = canEdit || canSetPassword;

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [userPage, roleList] = await Promise.all([
        listUsers(page, pageSize, getAccessToken()),
        listRoles(getAccessToken()),
      ]);
      setUsers(userPage.items);
      setMeta(userPage.meta);
      setRoles(roleList);
      setRole((current) => current || roleList[roleList.length - 1] || "");
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);

    if (!fullName.trim() || !email.trim() || !password.trim() || !role) {
      setCreateError("Name, email, password and role are all required.");
      return;
    }

    setIsCreating(true);
    try {
      await createUser(email.trim(), password, fullName.trim(), role, getAccessToken());
      showToast("User created.");
      setShowCreate(false);
      setEmail("");
      setFullName("");
      setPassword("");
      await load();
    } catch (error) {
      setCreateError(error instanceof ApiError ? error.message : "Unable to create this user.");
    } finally {
      setIsCreating(false);
    }
  }

  /**
   * Editing a user happens in a dialog, not from a dropdown in the grid.
   *
   * A picker sitting in the row applied to whichever line the eye happened to be on, and this is
   * the control that grants and revokes access to the whole system. Opening a dialog names the
   * person at the top of it, which is the confirmation the grid could not give.
   *
   * The name and the role are two endpoints, so this writes only what actually moved. The name goes
   * first: it is the one that cannot be refused, and doing it first means a role change blocked by
   * the last-Owner rule still leaves the rename saved rather than throwing both away.
   */
  async function handleSaveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditError(null);

    if (!editTarget || !editRole) {
      return;
    }

    const name = editName.trim();
    if (!name) {
      setEditError("Enter a name for this user.");
      return;
    }

    const nameChanged = name !== (editTarget.fullName ?? "");
    const roleChanged = editRole !== editTarget.role;

    if (!nameChanged && !roleChanged) {
      setEditTarget(null);
      return;
    }

    setIsSavingRole(true);
    try {
      if (nameChanged) {
        await setUserName(editTarget.id, name, getAccessToken());
      }
      if (roleChanged) {
        await setUserRole(editTarget.id, editRole, getAccessToken());
      }
      showToast(roleChanged ? `${name} is now ${editRole}.` : `${name} updated.`);
      setEditTarget(null);
      await load();
    } catch (error) {
      // The server refuses to demote the last Owner — its message explains why, so show it as-is.
      setEditError(error instanceof ApiError ? error.message : "Unable to save this user.");
    } finally {
      setIsSavingRole(false);
    }
  }

  /**
   * Resetting a password asks for the account's own email address first.
   *
   * Every row on this screen looks alike, and this is the one action that locks somebody out of
   * their account. Typing the address is the step that proves the right row was clicked; the
   * password fields stay disabled until it matches, so a mistyped row cannot be pushed through by
   * pressing Enter twice.
   */
  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError(null);

    if (!resetTarget) {
      return;
    }

    if (confirmEmail.trim().toLowerCase() !== resetTarget.email.toLowerCase()) {
      setResetError("That is not this user's email address.");
      return;
    }

    if (!resetPassword.trim()) {
      setResetError("Enter the new password.");
      return;
    }

    if (resetPassword !== confirmPassword) {
      setResetError("The two passwords do not match.");
      return;
    }

    setIsResetting(true);
    try {
      await resetUserPassword(resetTarget.id, resetPassword, getAccessToken());
      showToast(`Password reset for ${resetTarget.email}. They have been signed out everywhere.`);
      closeResetDialog();
    } catch (error) {
      // The server enforces the password policy and reports which rule failed — show it as-is.
      setResetError(error instanceof ApiError ? error.message : "Unable to reset this password.");
    } finally {
      setIsResetting(false);
    }
  }

  function openResetDialog(user: AppUser) {
    setResetTarget(user);
    setConfirmEmail("");
    setResetPassword("");
    setConfirmPassword("");
    setResetError(null);
  }

  function closeResetDialog() {
    setResetTarget(null);
    setConfirmEmail("");
    setResetPassword("");
    setConfirmPassword("");
    setResetError(null);
  }

  const isEmailConfirmed =
    resetTarget !== null && confirmEmail.trim().toLowerCase() === resetTarget.email.toLowerCase();

  // The Owner's role is fixed on this screen, so a role change is only an edit for anyone else.
  const hasEdits =
    editTarget !== null &&
    (editName.trim() !== (editTarget.fullName ?? "") ||
      (editTarget.role !== OWNER_ROLE && editRole !== editTarget.role));

  if (!isLoaded || isLoading) {
    return <p className="text-sm text-foreground/70">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">Users</h1>
        {canCreate && (
          <Button
            type="button"
            onClick={() => {
              setCreateError(null);
              setShowCreate(true);
            }}
          >
            Add User
          </Button>
        )}
      </div>

      {loadError && (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      )}

      <div className="table-wrap rounded-lg border border-border">
        <table className="stacked w-full text-left text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">What they can do</th>
              {hasRowActions && (
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td data-label="Email" className="px-4 py-3 font-medium">
                  {user.email}
                </td>
                {/* Plain text. Picking a role is done in the Edit dialog, where the person it
                    applies to is named. */}
                <td data-label="Role" className="px-4 py-3">
                  {user.role ?? "No role"}
                </td>
                <td data-label="What they can do" className="px-4 py-3 text-foreground/70">
                  {user.role ? ROLE_SUMMARY[user.role] ?? "As set on User Rights." : "Cannot use the system yet."}
                </td>
                {hasRowActions && (
                  <td data-label="" className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-4">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditTarget(user);
                            setEditName(user.fullName ?? "");
                            setEditRole(user.role ?? roles[roles.length - 1] ?? "");
                            setEditError(null);
                          }}
                          className="whitespace-nowrap text-foreground/70 hover:text-foreground"
                        >
                          Edit
                        </button>
                      )}
                      {canSetPassword && (
                        <button
                          type="button"
                          onClick={() => openResetDialog(user)}
                          className="whitespace-nowrap text-foreground/70 hover:text-foreground"
                        >
                          Reset Password
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && (
        <Pagination
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      <Modal open={showCreate} title="Add User" onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate} className="flex flex-col">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* First, and across both columns: it is what this person is called, and the email
                below it is only how they sign in. Wrapped, because Input puts className on the
                field itself — the grid item is this div. */}
            <div className="sm:col-span-2">
              <Input
                id="newFullName"
                label="Name"
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <Input id="newEmail" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              id="newPassword"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor="newRole" className="text-sm font-medium">
                Role
              </label>
              <select id="newRole" value={role} onChange={(e) => setRole(e.target.value)} className={fieldClassName}>
                {roles.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {ROLE_SUMMARY[role] && <p className="text-xs text-foreground/60">{ROLE_SUMMARY[role]}</p>}
            </div>
          </div>

          {createError && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {createError}
            </p>
          )}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} disabled={isCreating}>
              CANCEL
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Saving…" : "SUBMIT"}
            </Button>
          </ModalActions>
        </form>
      </Modal>

      <Modal
        open={editTarget !== null}
        title="Edit User"
        description={editTarget?.email}
        onClose={() => setEditTarget(null)}
      >
        <form onSubmit={handleSaveUser} className="flex flex-col">
          {/* The name is editable here; the email is not. Changing the address someone signs in
              with is a different thing from correcting their name, and is not offered. */}
          <div className="mb-3">
            <Input
              id="editFullName"
              label="Name"
              maxLength={100}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="editRole" className="text-sm font-medium">
              Role
            </label>
            <select
              id="editRole"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              disabled={editTarget?.role === OWNER_ROLE}
              className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {editTarget?.role === null && <option value="">No role</option>}
              {roles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {editTarget?.role === OWNER_ROLE ? (
              <p className="text-xs text-foreground/60">
                The Owner runs the shop and is the only role that can hand out access, so it is not changed from here.
              </p>
            ) : (
              ROLE_SUMMARY[editRole] && <p className="text-xs text-foreground/60">{ROLE_SUMMARY[editRole]}</p>
            )}
          </div>

          {editError && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {editError}
            </p>
          )}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)} disabled={isSavingRole}>
              CANCEL
            </Button>
            {/* Live once either field has actually moved. An Owner's role is fixed here, but their
                name is not — so this can no longer key off the role alone. */}
            <Button type="submit" disabled={isSavingRole || !editRole || !editName.trim() || !hasEdits}>
              {isSavingRole ? "Saving…" : "SUBMIT"}
            </Button>
          </ModalActions>
        </form>
      </Modal>

      <Modal
        open={resetTarget !== null}
        title="Reset Password"
        description={resetTarget?.email}
        onClose={closeResetDialog}
      >
        <form onSubmit={handleResetPassword} className="flex flex-col">
          <p className="text-sm text-foreground/70">
            Type this user&rsquo;s email address to confirm, then set their new password. They will be signed out on
            every device, so tell them what it is.
          </p>

          <div className="mt-3 flex flex-col gap-3">
            <Input
              id="confirmEmail"
              label="Email address"
              type="email"
              autoComplete="off"
              placeholder={resetTarget?.email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
            {/* Disabled until the address matches, so the fields open only once the right person is
                confirmed rather than sitting ready for whichever row was clicked. */}
            <Input
              id="resetPassword"
              label="New password"
              type="password"
              autoComplete="new-password"
              disabled={!isEmailConfirmed}
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
            <Input
              id="confirmPassword"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              disabled={!isEmailConfirmed}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={
                confirmPassword && resetPassword !== confirmPassword ? "The two passwords do not match." : undefined
              }
            />
          </div>
          <p className="mt-1 text-xs text-foreground/60">At least 8 characters, with upper, lower, and a number.</p>

          {resetError && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {resetError}
            </p>
          )}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={closeResetDialog} disabled={isResetting}>
              CANCEL
            </Button>
            <Button type="submit" disabled={isResetting || !isEmailConfirmed || !resetPassword || !confirmPassword}>
              {isResetting ? "Saving…" : "CONFIRM"}
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </div>
  );
}
