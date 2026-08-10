"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";
import { listUsers, listRoles, createUser, setUserRole, PERMISSIONS, type AppUser } from "@/lib/api/users";

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
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const canManage = can(PERMISSIONS.usersManage);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [userList, roleList] = await Promise.all([listUsers(getAccessToken()), listRoles(getAccessToken())]);
      setUsers(userList);
      setRoles(roleList);
      setRole((current) => current || roleList[roleList.length - 1] || "");
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  async function handleRoleChange(user: AppUser, nextRole: string) {
    try {
      await setUserRole(user.id, nextRole, getAccessToken());
      showToast(`${user.email} is now ${nextRole}.`);
      await load();
    } catch (error) {
      // The server refuses to demote the last Owner — its message explains why, so show it as-is.
      showToast(error instanceof ApiError ? error.message : "Unable to change this user's role.", "error");
      await load();
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

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">What they can do</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <select
                      value={user.role ?? ""}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
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
                  ) : (
                    (user.role ?? "No role")
                  )}
                </td>
                <td className="px-4 py-3 text-foreground/70">{user.role ? ROLE_SUMMARY[user.role] ?? "—" : "Cannot use the system yet."}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
