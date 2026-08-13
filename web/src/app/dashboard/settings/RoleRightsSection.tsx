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

/** The screen names the shop uses, where the permission module name is not what appears in the menu. */
const SCREEN_LABELS: Record<string, string> = {
  WhatsApp: "WhatsApp",
  Pricing: "Price Details",
  Inventory: "Inventory",
  Activity: "Activity Log",
  Users: "Users",
  Settings: "Settings",
  Measurements: "Measurements",
};

/**
 * What each tick actually permits, spelled out.
 *
 * "Manage" on its own does not say whether it includes deleting, or assigning, or taking payment —
 * and an Owner handing out access is entitled to know before they tick it.
 */
const SCREEN_ACTIONS: Record<string, { view: string; manage?: string }> = {
  Customers: {
    view: "See customers and their history",
    manage: "Add, edit and delete customers",
  },
  Measurements: {
    view: "See measurements and past versions",
    manage: "Record and correct measurements",
  },
  Employees: {
    view: "See staff records and their order history",
    manage: "Add and edit staff, and retire them",
  },
  Orders: {
    view: "See orders and where they stand",
    manage: "Create and edit orders, assign staff, change status",
  },
  Invoices: {
    view: "See invoices and what is owed",
    manage: "Raise invoices, take payments, apply discounts",
  },
  WhatsApp: {
    view: "See messages sent to customers",
    manage: "Send messages",
  },
  Reports: {
    view: "Open every report, including birthdays and anniversaries",
  },
  Pricing: {
    view: "See the cloth price list",
    manage: "Add and change prices",
  },
  Inventory: {
    view: "See cloth receipts and stock levels",
    manage: "Record cloth arriving",
  },
  Settings: {
    view: "Open settings screens",
    manage: "Change order duration and measurement templates",
  },
  Activity: {
    view: "See who did what, and when",
  },
  Users: {
    view: "See who can sign in and their roles",
    manage: "Create users, set roles, reset passwords, change these rights",
  },
};

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

  /**
   * Toggling one box can move the other, because the two are not independent.
   *
   * Manage without View is a role that may change things on a screen it cannot open — the menu
   * hides it, every list is unreachable, and the rights table still claims they can edit. So
   * ticking Manage ticks View, and clearing View clears Manage with it. View is the base right;
   * Manage is something added on top of it.
   */
  function toggle(permission: string) {
    const [screen, action] = permission.split(".");
    const view = `${screen}.View`;
    const manage = `${screen}.Manage`;

    setSelected((previous) => {
      const has = previous.includes(permission);
      const without = previous.filter((p) => p !== permission);

      if (has) {
        return action === "View" ? without.filter((p) => p !== manage) : without;
      }

      const added = [...previous, permission];
      return action === "Manage" && !added.includes(view) ? [...added, view] : added;
    });
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
                  <th className="w-40 px-4 py-2 font-medium">Screen</th>
                  <th className="px-4 py-2 font-medium">View</th>
                  <th className="px-4 py-2 font-medium">Manage</th>
                </tr>
              </thead>
              <tbody>
                {matrix.screens.map((screen) => {
                  const view = screen.permissions.find((p) => p.action === "View");
                  const manage = screen.permissions.find((p) => p.action === "Manage");
                  const actions = SCREEN_ACTIONS[screen.screen];
                  return (
                    <tr key={screen.screen} className="border-b border-border align-top last:border-0">
                      <td className="px-4 py-3 font-medium">{SCREEN_LABELS[screen.screen] ?? screen.screen}</td>
                      {([
                        [view, actions?.view],
                        [manage, actions?.manage],
                      ] as const).map(([entry, described], index) => (
                        <td key={index} className="px-4 py-3">
                          {/* A screen that defines no Manage action shows nothing rather than a
                              checkbox that could never mean anything. */}
                          {entry ? (
                            <label className="flex cursor-pointer items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selected.includes(entry.permission)}
                                disabled={!isEditable || isSaving}
                                onChange={() => toggle(entry.permission)}
                                aria-label={`${entry.action} ${screen.screen}`}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                              />
                              {/* What the tick actually permits, in the shop's words. "Manage" alone
                                  does not say whether it includes deleting. */}
                              <span className="text-foreground/70">{described ?? entry.action}</span>
                            </label>
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
