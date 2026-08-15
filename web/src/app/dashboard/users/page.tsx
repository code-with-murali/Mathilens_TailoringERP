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
import { listUsers, listRoles, createUser, setUserRole, resetUserPassword, issueResetCode, PERMISSIONS, type AppUser } from "@/lib/api/users";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

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
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // The user whose role is being changed, and the role picked for them. Held here rather than per
  // row, because the picker now lives in a dialog instead of in the grid.
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Reset targets one user at a time; holding the user here doubles as "the dialog is open".
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Sending a code asks first and shows second, in one dialog. `codeTarget` is who it is for;
  // `issuedCode` is null while the question is still on screen and holds the code afterwards.
  // Nothing reads it back — the server keeps a hash, so if this is dismissed before it is written
  // down, the only way on is a new code.
  const [codeTarget, setCodeTarget] = useState<AppUser | null>(null);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedExpiry, setIssuedExpiry] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);

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

    if (!email.trim() || !password.trim() || !role) {
      setCreateError("Email, password and role are all required.");
      return;
    }

    setIsCreating(true);
    try {
      await createUser(email.trim(), password, role, getAccessToken());
      showToast("User created.");
      setShowCreate(false);
      setEmail("");
      setPassword("");
      await load();
    } catch (error) {
      setCreateError(error instanceof ApiError ? error.message : "Unable to create this user.");
    } finally {
      setIsCreating(false);
    }
  }

  /**
   * Changing a role happens in a dialog, not from a dropdown in the grid.
   *
   * A picker sitting in the row applied to whichever line the eye happened to be on, and this is
   * the control that grants and revokes access to the whole system. Opening a dialog names the
   * person at the top of it, which is the confirmation the grid could not give.
   */
  async function handleSaveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditError(null);

    if (!editTarget || !editRole) {
      return;
    }

    setIsSavingRole(true);
    try {
      await setUserRole(editTarget.id, editRole, getAccessToken());
      showToast(`${editTarget.email} is now ${editRole}.`);
      setEditTarget(null);
      await load();
    } catch (error) {
      // The server refuses to demote the last Owner — its message explains why, so show it as-is.
      setEditError(error instanceof ApiError ? error.message : "Unable to change this user's role.");
    } finally {
      setIsSavingRole(false);
    }
  }

  /**
   * Issues a one-time code instead of setting a password on someone's behalf.
   *
   * The Owner reads it out and never learns what the user chooses. Their sessions end now rather
   * than when the code is used, so an account in the wrong hands stops working immediately — which
   * is why this is asked before it is done rather than fired off by a single click in a row.
   */
  async function handleIssueCode() {
    if (!codeTarget) {
      return;
    }

    setCodeError(null);
    setIsIssuing(true);
    try {
      const issued = await issueResetCode(codeTarget.id, getAccessToken());
      setIssuedCode(issued.code);
      setIssuedExpiry(issued.expiresAtUtc);
    } catch (error) {
      setCodeError(error instanceof ApiError ? error.message : "Unable to issue a reset code.");
    } finally {
      setIsIssuing(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError(null);

    if (!resetTarget) {
      return;
    }

    if (!resetPassword.trim()) {
      setResetError("Enter the new password.");
      return;
    }

    setIsResetting(true);
    try {
      await resetUserPassword(resetTarget.id, resetPassword, getAccessToken());
      showToast(`Password reset for ${resetTarget.email}. They have been signed out everywhere.`);
      setResetTarget(null);
      setResetPassword("");
    } catch (error) {
      // The server enforces the password policy and reports which rule failed — show it as-is.
      setResetError(error instanceof ApiError ? error.message : "Unable to reset this password.");
    } finally {
      setIsResetting(false);
    }
  }

  function closeCodeDialog() {
    setCodeTarget(null);
    setIssuedCode(null);
    setIssuedExpiry(null);
    setCodeError(null);
  }

  if (!isLoaded || isLoading) {
    return <p className="text-sm text-foreground/70">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Who can sign in, and what each of them is allowed to do. A role decides which screens they see and which actions they can take.
          </p>
        </div>
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
                            setEditRole(user.role ?? roles[roles.length - 1] ?? "");
                            setEditError(null);
                          }}
                          className="whitespace-nowrap text-foreground/70 hover:text-foreground"
                        >
                          Edit
                        </button>
                      )}
                      {canSetPassword && (
                        <>
                          {/* Named plainly, because it is the one to reach for: the Owner hands
                              over a code and never learns the password that gets chosen. */}
                          <button
                            type="button"
                            onClick={() => {
                              setCodeTarget(user);
                              setIssuedCode(null);
                              setIssuedExpiry(null);
                              setCodeError(null);
                            }}
                            className="whitespace-nowrap text-primary hover:underline"
                          >
                            Send Code
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResetTarget(user);
                              setResetPassword("");
                              setResetError(null);
                            }}
                            className="whitespace-nowrap text-foreground/70 hover:text-foreground"
                          >
                            Set Password
                          </button>
                        </>
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
        <form onSubmit={handleSaveRole} className="flex flex-col">
          <div className="flex flex-col gap-1">
            <label htmlFor="editRole" className="text-sm font-medium">
              Role
            </label>
            <select id="editRole" value={editRole} onChange={(e) => setEditRole(e.target.value)} className={fieldClassName}>
              {editTarget?.role === null && <option value="">No role</option>}
              {roles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {ROLE_SUMMARY[editRole] && <p className="text-xs text-foreground/60">{ROLE_SUMMARY[editRole]}</p>}
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
            <Button type="submit" disabled={isSavingRole || !editRole}>
              {isSavingRole ? "Saving…" : "SUBMIT"}
            </Button>
          </ModalActions>
        </form>
      </Modal>

      <Modal
        open={resetTarget !== null}
        title="Set Password"
        description={resetTarget?.email}
        onClose={() => setResetTarget(null)}
      >
        <form onSubmit={handleResetPassword} className="flex flex-col">
          <p className="text-sm text-foreground/70">
            You do not need their old password. They will be signed out on every device, so tell them the new one.
          </p>
          <div className="mt-3">
            <Input
              id="resetPassword"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </div>
          <p className="mt-1 text-xs text-foreground/60">At least 8 characters, with upper, lower, and a number.</p>

          {resetError && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {resetError}
            </p>
          )}

          <ModalActions>
            <Button type="button" variant="secondary" onClick={() => setResetTarget(null)} disabled={isResetting}>
              CANCEL
            </Button>
            <Button type="submit" disabled={isResetting}>
              {isResetting ? "Saving…" : "CONFIRM"}
            </Button>
          </ModalActions>
        </form>
      </Modal>

      {/*
        Two states in one dialog: the question, then the code.

        The code is shown once and never again. Only a hash reaches the database, so this is the
        single moment the plaintext exists anywhere — dismissing it before writing the code down
        means issuing a new one, which is the correct trade for not storing a working credential.
      */}
      <Modal
        open={codeTarget !== null}
        title="Send Code"
        description={codeTarget?.email}
        onClose={closeCodeDialog}
      >
        {issuedCode ? (
          <div className="flex flex-col">
            <p className="text-sm text-foreground/70">
              Give this to them in person. They enter it on the login screen under &ldquo;Have a reset code?&rdquo; and
              choose their own password — you never need to know it.
            </p>

            <p className="mt-3 select-all rounded-md border border-border bg-background/40 px-4 py-3 text-center font-mono text-xl tracking-widest sm:text-2xl">
              {issuedCode}
            </p>

            <p className="mt-3 text-sm text-foreground/70">
              Works once, and stops working{" "}
              {issuedExpiry ? `at ${new Date(issuedExpiry).toLocaleString()}` : "after a day"}. They have been signed
              out everywhere already.
            </p>

            <ModalActions>
              <Button type="button" onClick={closeCodeDialog}>
                I have written it down
              </Button>
            </ModalActions>
          </div>
        ) : (
          <div className="flex flex-col">
            <p className="text-sm text-foreground/70">
              Issue a one-time code for this user to set their own password? They will be signed out everywhere
              straight away, and any code issued to them before this stops working.
            </p>

            {codeError && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {codeError}
              </p>
            )}

            <ModalActions>
              <Button type="button" variant="secondary" onClick={closeCodeDialog} disabled={isIssuing}>
                CANCEL
              </Button>
              <Button type="button" onClick={handleIssueCode} disabled={isIssuing}>
                {isIssuing ? "Issuing…" : "CONFIRM"}
              </Button>
            </ModalActions>
          </div>
        )}
      </Modal>
    </div>
  );
}
