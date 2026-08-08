"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, clearTokens } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/dashboard/customers", label: "Customers", icon: CustomersIcon },
  { href: "/dashboard/employees", label: "Employees", icon: EmployeesIcon },
  { href: "/dashboard/orders", label: "Orders", icon: OrdersIcon },
  { href: "/dashboard/invoices", label: "Invoices", icon: InvoicesIcon },
  { href: "/dashboard/whatsapp", label: "WhatsApp", icon: WhatsAppIcon },
  { href: "/dashboard/reports", label: "Reports", icon: ReportsIcon },
  { href: "/dashboard/price-detail", label: "Price Detail", icon: PriceDetailIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
] as const;

/**
 * The dashboard shell: left nav rail + header + content area (00_MASTER_SPEC.md § 9.6 Page
 * Layout Standards). Operational widgets arrive as their modules are built — this is
 * intentionally just the shell for Phase 1 (docs/03_ROADMAP.md).
 */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const router = useRouter();
  const pathname = usePathname();
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
    <div className="flex min-h-full flex-1">
      <aside className="flex w-36 shrink-0 flex-col border-r border-border print:hidden">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 whitespace-nowrap border-b border-border px-3 py-4 text-sm font-semibold hover:text-foreground/80"
        >
          Mathilens ERP
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4 text-sm">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard" ? pathname === href : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  isActive
                    ? "bg-surface font-medium text-foreground"
                    : "text-foreground/70 hover:bg-surface hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/70 hover:bg-surface hover:text-foreground"
          >
            <LogoutIcon className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-h-full flex-1 flex-col">
        <main className="flex-1 px-6 py-4">{children}</main>
      </div>
    </div>
  );
}

type IconProps = { className?: string };

function DashboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function CustomersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M17 12.5c2.5.3 4.5 2.6 4.5 5.5" />
    </svg>
  );
}

function EmployeesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="4" y="7" width="16" height="13" rx="1.5" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function OrdersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 3h12l1 5H5l1-5Z" />
      <path d="M4 8h16l-1.2 11.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 8Z" />
      <path d="M9 11a3 3 0 0 0 6 0" />
    </svg>
  );
}

function InvoicesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 2h9l3 3v17H6V2Z" />
      <path d="M15 2v3h3" />
      <path d="M9 12h6M9 16h6M9 8h3" />
    </svg>
  );
}

function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 3a8.5 8.5 0 0 0-7.4 12.7L3 21l5.4-1.6A8.5 8.5 0 1 0 12 3Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5 .5 0 1-.3 1-.8v-1l-2-1-1 1c-1-.5-1.7-1.2-2.2-2.2l1-1-1-2h-1c-.5 0-.8.5-.8 1Z" />
    </svg>
  );
}

function ReportsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" />
      <rect x="12" y="8" width="3" height="10" />
      <rect x="17" y="5" width="3" height="13" />
    </svg>
  );
}

function PriceDetailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 3h6a2 2 0 0 1 2 2v6l-9.3 9.3a1 1 0 0 1-1.4 0L3 14a1 1 0 0 1 0-1.4L12 3Z" />
      <circle cx="16.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function SettingsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

function LogoutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
