"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The dashboard shell: page header + nav + content area (00_MASTER_SPEC.md § 9.6 Page
 * Layout Standards). Operational widgets arrive as their modules are built — this is
 * intentionally just the shell for Phase 1 (docs/03_ROADMAP.md).
 */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Deliberately not `useSyncExternalStore`: this value has no valid server snapshot
    // (there is no cookie/session on the server to check), so treating it as one forces a
    // render with `authenticated=false` on the client's first paint too, and a redirect effect
    // keyed off that value fires before the real client check ever lands — a flash-redirect to
    // /login even when the user has a valid token. A one-time mount check avoids that race.
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(true);
  }, [router]);

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  if (!checked) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Mathilens Tailoring ERP</span>
          <nav className="flex items-center gap-4 text-sm text-foreground/70">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/dashboard/customers" className="hover:text-foreground">
              Customers
            </Link>
            <Link href="/dashboard/employees" className="hover:text-foreground">
              Employees
            </Link>
            <Link href="/dashboard/orders" className="hover:text-foreground">
              Orders
            </Link>
            <Link href="/dashboard/invoices" className="hover:text-foreground">
              Invoices
            </Link>
            <Link href="/dashboard/whatsapp" className="hover:text-foreground">
              WhatsApp
            </Link>
            <Link href="/dashboard/settings" className="hover:text-foreground">
              Settings
            </Link>
            <Link href="/dashboard/reports" className="hover:text-foreground">
              Reports
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
