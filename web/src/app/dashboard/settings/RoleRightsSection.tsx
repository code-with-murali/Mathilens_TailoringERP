"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccessToken } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";
import {
  getRolePermissions,
  setRolePermissions,
  resetRolePermissions,
  PERMISSIONS,
  type RolePermissionMatrix,
} from "@/lib/api/users";

const fieldClassName =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25";

/**
 * Which screens a role may see, and whether it may change anything on them.
 *
 * Owner is deliberately not editable — it always holds every permission. It is the only role
 * guaranteed to carry Users.Manage, so a shop that stripped it would have nobody left able to
 * grant access to anyone, including to undo that change. The server refuses it too; this just
 * makes the reason visible instead of the save failing.
 */
export function RoleRightsSection() {
  const { showToast } = useToast();
  const { can, isLoaded } = usePermissions();
  const [matrix, setMatrix] = useState<RolePermissionMatrix | null>(null);
  const [role, setRole] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing rights is access control, so it takes Users.Manage rather than Settings.Manage —
  // otherwise a Manager could grant themselves the right to hand out access.
  const canEditRights = can(PERMISSIONS.usersManage);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await getRolePermissions(getAccessToken());
      setMatrix(loaded);
      setRole((current) => current || loaded.roles.find((r) => r.isEditable)?.role || loaded.roles[0]?.role || "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load role rights.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // See CustomersPage for why this fetch-on-dependency-change pattern is intentionally not
    // restructured around the set-state-in-effect lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    // Switching role discards unsaved ticks rather than carrying them across roles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(matrix?.roles.find((r) => r.role === role)?.permissions ?? []);
  }, [role, matrix]);

  const current = matrix?.roles.find((r) => r.role === role);
  const isEditable = Boolean(current?.isEditable) && canEditRights;
  const isDirty =
    current !== undefined && JSON.stringify([...selected].sort()) !== JSON.stringify([...current.permissions].sort());

  function toggle(permission: string) {
    setSelected((previous) =>
      previous.includes(permission) ? previous.filter((p) => p !== permission) : [...previous, permission],
    );
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const saved = await setRolePermissions(role, selected, getAccessToken());
      setMatrix((previous) =>
        previous ? { ...previous, roles: previous.roles.map((r) => (r.role === role ? saved : r)) } : previous,
      );
      showToast(`${role} rights saved.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save these rights.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    setError(null);
    setIsSaving(true);
    try {
      await resetRolePermissions(role, getAccessToken());
      await load();
      showToast(`${role} restored to its standard rights.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reset these rights.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      <div>
        <h2 className="text-lg font-semibold">Role &amp; Screen Rights</h2>
        <p className="text-sm text-foreground/70">
          Which screens each role can open, and whether they can change anything there. Takes effect on their next
          action — nobody has to sign out and back in.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-foreground/70">Loading…</p>
      ) : !matrix ? (
        <p role="alert" className="text-sm text-danger">
          {error ?? "Unable to load role rights."}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="rightsRole" className="text-sm font-medium">
              Role
            </label>
            <select id="rightsRole" value={role} onChange={(e) => setRole(e.target.value)} className={fieldClassName}>
              {matrix.roles.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.role}
                  {!r.isEditable ? " (all rights, fixed)" : r.isCustomised ? " (customised)" : ""}
                </option>
              ))}
            </select>
          </div>

          {current && !current.isEditable && (
            <p className="rounded-md border border-border bg-background/40 p-3 text-sm text-foreground/70">
              Owner always has every right, and that cannot be changed — it is the only role guaranteed to be able to
              grant access, so removing it would leave nobody able to fix it.
            </p>
          )}

          {current?.isEditable && !canEditRights && (
            <p className="rounded-md border border-border bg-background/40 p-3 text-sm text-foreground/70">
              You can see these rights but not change them. Editing access is reserved for an Owner.
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background/40">
                <tr>
                  <th className="px-4 py-2 font-medium">Screen</th>
                  <th className="px-4 py-2 font-medium">View</th>
                  <th className="px-4 py-2 font-medium">Manage</th>
                </tr>
              </thead>
              <tbody>
                {matrix.screens.map((screen) => {
                  const view = screen.permissions.find((p) => p.action === "View");
                  const manage = screen.permissions.find((p) => p.action === "Manage");
                  return (
                    <tr key={screen.screen} className="border-b border-border last:border-0">
                      <td className="px-4 py-2">{screen.screen}</td>
                      {[view, manage].map((entry, index) => (
                        <td key={index} className="px-4 py-2">
                          {/* A screen that defines no Manage action shows nothing rather than a
                              checkbox that could never mean anything. */}
                          {entry ? (
                            <input
                              type="checkbox"
                              checked={selected.includes(entry.permission)}
                              disabled={!isEditable || isSaving}
                              onChange={() => toggle(entry.permission)}
                              aria-label={`${entry.action} ${screen.screen}`}
                              className="h-4 w-4 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          ) : (
                            <span className="text-foreground/30">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          {isEditable && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving || !current?.isCustomised}
                className="text-sm text-foreground/70 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Restore standard rights
              </button>
              <Button type="button" onClick={handleSave} disabled={isSaving || !isDirty}>
                {isSaving ? "Saving…" : "Save rights"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
