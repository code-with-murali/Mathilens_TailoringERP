"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import { useBranding } from "@/lib/use-branding";
import { usePermissions } from "@/lib/use-permissions";
import { PERMISSIONS } from "@/lib/api/users";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon, permission: null },
  { href: "/dashboard/customers", label: "Customers", icon: CustomersIcon, permission: PERMISSIONS.customersView },
  { href: "/dashboard/employees", label: "Employees", icon: EmployeesIcon, permission: PERMISSIONS.employeesView },
  { href: "/dashboard/orders", label: "Orders", icon: OrdersIcon, permission: PERMISSIONS.ordersView },
  { href: "/dashboard/invoices", label: "Invoices", icon: InvoicesIcon, permission: PERMISSIONS.invoicesView },
  { href: "/dashboard/whatsapp", label: "WhatsApp", icon: WhatsAppIcon, permission: PERMISSIONS.whatsAppView },
  { href: "/dashboard/reports", label: "Reports", icon: ReportsIcon, permission: PERMISSIONS.reportsView },
  { href: "/dashboard/price-detail", label: "Price Detail", icon: PriceDetailIcon, permission: PERMISSIONS.pricingView },
  { href: "/dashboard/activity", label: "Activity Log", icon: ActivityIcon, permission: PERMISSIONS.activityView },
  { href: "/dashboard/users", label: "Users", icon: UsersIcon, permission: PERMISSIONS.usersView },
  { href: "/dashboard/branding", label: "Branding", icon: BrandingIcon, permission: PERMISSIONS.settingsView },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon, permission: PERMISSIONS.settingsView },
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
  // Two separate pieces of state because the toggle means two different things by screen size:
  // on a phone or tablet the nav is a drawer that slides over the content, on a desktop it is a
  // rail that shrinks to icons. One shared boolean would either open the drawer by default on
  // mobile or collapse the desktop rail by default — both wrong.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Also applies the shop's colour to the theme's CSS variables, which is why it lives in the
  // shell rather than on the Branding page — every screen inside gets it.
  const branding = useBranding();
  const { isLoaded: permissionsLoaded, can } = usePermissions();

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

  const navItems = permissionsLoaded
    ? NAV_ITEMS.filter((item) => item.permission === null || can(item.permission))
    : [];

  const activeLabel = NAV_ITEMS.find(({ href }) =>
    href === "/dashboard" ? pathname === href : pathname?.startsWith(href),
  )?.label ?? "Dashboard";

  // The New Order page has its own immersive theme (a fixed dark skin, independent of the
  // ThemeToggle) plus its own heading and "Back to orders" link — the shared breadcrumb/theme
  // toggle bar would be redundant chrome and the toggle would visibly do nothing there.
  const hideHeader = pathname === "/dashboard/orders/new";

  return (
    <div className="flex min-h-full flex-1">
      {/* Backdrop for the small-screen drawer. Tapping it closes the nav, as a drawer should. */}
      {isDrawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-border bg-surface transition-[transform,width] duration-200 lg:static lg:translate-x-0 print:hidden ${
          isDrawerOpen ? "w-60 translate-x-0" : "w-60 -translate-x-full"
        } ${isCollapsed ? "lg:w-16" : "lg:w-60"}`}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 whitespace-nowrap border-b border-border px-5 py-4 text-sm font-semibold"
        >
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- an arbitrary shop-supplied URL can't be known to next/image at build time
            <img src={branding.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-md object-contain" />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              {(branding.shopName || "Mathilens").charAt(0).toUpperCase()}
            </span>
          )}
          <span className={isCollapsed ? "lg:hidden" : ""}>{branding.shopName || "Mathilens ERP"}</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 text-sm">
          {/* Nothing is shown until /me has answered — briefly rendering links the user turns out
              not to have would be worse than a moment of an empty rail. */}
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard" ? pathname === href : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                // Navigating on a phone should get the drawer out of the way, not leave it
                // covering the page the user just asked for.
                onClick={() => setIsDrawerOpen(false)}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground/65 hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={isCollapsed ? "lg:hidden" : ""}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/65 transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <LogoutIcon className="h-4 w-4 shrink-0" />
            <span className={isCollapsed ? "lg:hidden" : ""}>Sign out</span>
          </button>
        </div>
      </aside>
      <div className="flex min-h-full flex-1 flex-col">
        {!hideHeader && (
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-sm print:hidden">
            <div className="flex items-center gap-3">
              {/* Two buttons rather than one, each shown at the size it belongs to — CSS decides
                  which, so neither needs to guess the viewport before the first paint. */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open navigation"
                className="-ml-2 rounded-md p-2 text-foreground/65 transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
                aria-pressed={isCollapsed}
                className="-ml-2 hidden rounded-md p-2 text-foreground/65 transition-colors hover:bg-surface-hover hover:text-foreground lg:block"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-foreground/70">{activeLabel}</span>
            </div>
            <ThemeToggle />
          </header>
        )}
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

type IconProps = { className?: string };

function UsersIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BrandingIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="6.5" cy="12" r="2.5" />
      <circle cx="17" cy="14" r="2.5" />
      <path d="M12 22a10 10 0 1 1 10-10c0 2-1.5 3-3 3h-2a3 3 0 0 0-3 3 3 3 0 0 1-2 4Z" />
    </svg>
  );
}

function ActivityIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

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
