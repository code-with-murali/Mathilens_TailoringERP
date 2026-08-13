"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_PAGE_SIZE, Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError, type PaginationMeta } from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";
import { listUsers, listRoles, createUser, setUserRole, resetUserPassword, issueResetCode, PERMISSIONS, type AppUser } from "@/lib/api/users";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/** Plain-language descriptions, because "Manager" alone doesn't tell an owner what they're handing over. */
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
  // Role changes chosen but not yet saved, keyed by user id, plus which row is mid-save.
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
  const [savingRoleFor, setSavingRoleFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Reset targets one user at a time; holding the user here doubles as "the panel is open".
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // The code issued for a user, held only to show it once. Nothing reads it back — the server keeps
  // a hash, so if this is dismissed before it is written down, the only way on is a new code.
  const [issuedFor, setIssuedFor] = useState<AppUser | null>(null);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedExpiry, setIssuedExpiry] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);

  const canManage = can(PERMISSIONS.usersManage);

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
   * Choosing a role no longer applies it — the change is held until Save.
   *
   * A dropdown that writes on change gives no moment to notice you picked the wrong row, and this
   * one grants and revokes access to the whole system. The Save button only appears once the
   * selection actually differs from what is stored, so an unchanged row offers nothing to press.
   */
  function handleRoleSelect(user: AppUser, nextRole: string) {
    setPendingRoles((pending) => ({ ...pending, [user.id]: nextRole }));
  }

  async function handleSaveRole(user: AppUser) {
    const nextRole = pendingRoles[user.id];
    if (!nextRole || nextRole === user.role) {
      return;
    }

    setSavingRoleFor(user.id);
    try {
      await setUserRole(user.id, nextRole, getAccessToken());
      showToast(`${user.email} is now ${nextRole}.`);
      setPendingRoles((pending) => {
        const next = { ...pending };
        delete next[user.id];
        return next;
      });
      await load();
    } catch (error) {
      // The server refuses to demote the last Owner — its message explains why, so show it as-is.
      showToast(error instanceof ApiError ? error.message : "Unable to change this user's role.", "error");
      await load();
    } finally {
      setSavingRoleFor(null);
    }
  }

  /**
   * Issues a one-time code instead of setting a password on someone's behalf.
   *
   * The Owner reads it out and never learns what the user chooses. Their sessions end now rather
   * than when the code is used, so an account in the wrong hands stops working immediately.
   */
  async function handleIssueCode(user: AppUser) {
    setIsIssuing(true);
    try {
      const issued = await issueResetCode(user.id, getAccessToken());
      setIssuedFor(user);
      setIssuedCode(issued.code);
      setIssuedExpiry(issued.expiresAtUtc);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "Unable to issue a reset code.", "error");
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

  if (!isLoaded || isLoading) {
    return <p className="text-sm text-foreground/70">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Who can sign in, and what each of them is allowed to do. A role decides which screens they see and which actions they can take.
          </p>
        </div>
        {canManage && !showCreate && (
          <Button type="button" onClick={() => setShowCreate(true)}>
            Add User
          </Button>
        )}
      </div>

      {/*
        Shown once and never again. Only a hash reaches the database, so this panel is the single
        moment the plaintext exists anywhere — dismissing it before writing the code down means
        issuing a new one, which is the correct trade for not storing a working credential.
      */}
      {issuedCode && issuedFor && (
        <div className="flex max-w-xl flex-col gap-3 rounded-lg border border-primary/40 bg-primary/5 p-6">
          <div>
            <h2 className="text-lg font-semibold">Reset code for {issuedFor.email}</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Give this to them in person. They enter it on the login screen under &ldquo;Have a reset
              code?&rdquo; and choose their own password — you never need to know it.
            </p>
          </div>

          <p className="select-all rounded-md border border-border bg-surface px-4 py-3 text-center font-mono text-2xl tracking-widest">
            {issuedCode}
          </p>

          <p className="text-sm text-foreground/70">
            Works once, and stops working{" "}
            {issuedExpiry ? `at ${new Date(issuedExpiry).toLocaleString()}` : "after a day"}. They have been
            signed out everywhere already.
          </p>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIssuedCode(null);
                setIssuedFor(null);
                setIssuedExpiry(null);
              }}
              className="text-sm text-foreground/70 hover:text-foreground"
            >
              I have written it down
            </button>
          </div>
        </div>
      )}

      {loadError && (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-6">
          <Input id="newEmail" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input id="newPassword" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex flex-col gap-1">
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
          {createError && (
            <p role="alert" className="text-sm text-danger">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-foreground/70 hover:text-foreground">
              Cancel
            </button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      )}

      {resetTarget && (
        <form onSubmit={handleResetPassword} className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-6">
          <div>
            <h2 className="text-lg font-semibold">Reset password</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Set a new password for <span className="font-medium text-foreground">{resetTarget.email}</span>. You do not
              need their old one. They will be signed out on every device, so tell them the new password.
            </p>
          </div>
          <Input
            id="resetPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
          />
          <p className="text-sm text-foreground/60">At least 8 characters, with upper, lower, and a number.</p>
          {resetError && (
            <p role="alert" className="text-sm text-danger">
              {resetError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setResetTarget(null)}
              className="text-sm text-foreground/70 hover:text-foreground"
            >
              Cancel
            </button>
            <Button type="submit" disabled={isResetting}>
              {isResetting ? "Resetting…" : "Reset password"}
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">What they can do</th>
              {canManage && (
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={pendingRoles[user.id] ?? user.role ?? ""}
                        onChange={(e) => handleRoleSelect(user, e.target.value)}
                        className={fieldClassName}
                        aria-label={`Role for ${user.email}`}
                      >
                        {user.role === null && <option value="">No role</option>}
                        {roles.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {/* Only once the selection differs from what is stored — an unchanged row has
                          nothing to save, and a permanently visible button invites a stray click on
                          the control that grants access to everything. */}
                      {pendingRoles[user.id] !== undefined && pendingRoles[user.id] !== user.role && (
                        <Button
                          type="button"
                          onClick={() => handleSaveRole(user)}
                          disabled={savingRoleFor === user.id}
                          className="shrink-0 px-3 py-1.5 text-xs"
                        >
                          {savingRoleFor === user.id ? "Saving…" : "Save"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    (user.role ?? "No role")
                  )}
                </td>
                <td className="px-4 py-3 text-foreground/70">{user.role ? ROLE_SUMMARY[user.role] ?? "—" : "Cannot use the system yet."}</td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-4">
                      {/* First and named plainly, because it is the one to reach for: the Owner
                          hands over a code and never learns the password that gets chosen. */}
                      <button
                        type="button"
                        onClick={() => handleIssueCode(user)}
                        disabled={isIssuing}
                        className="whitespace-nowrap text-primary hover:underline disabled:opacity-50"
                      >
                        Send reset code
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
                        Set password
                      </button>
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
    </div>
  );
}
