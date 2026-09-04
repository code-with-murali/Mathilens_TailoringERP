"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { primaryNav } from "@/content/navigation";
import { brand, onlineStore } from "@/content/site";
import { track } from "@/lib/analytics";
import { asset } from "@/lib/asset";

/**
 * The site header.
 *
 * Every page on this site opens with an ink hero, so the header can sit transparently over the
 * top of it and only take on a background once the reader has scrolled past — which is what keeps
 * the first screen looking like a photograph rather than like a web page with a bar on it.
 *
 * Five items and no more. The deeper pages are reached from the sections that introduce them and
 * from the footer; a navigation that lists every URL reads as a directory, not as a brand.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Route change closes the drawer — otherwise tapping a link leaves it open over the new page.
  // Adjusted during render rather than in an effect: React re-runs this component before anything
  // is committed, so the new route never paints with the old menu still open.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMenuOpen(false);
    setOpenGroup(null);
  }

  // A drawer that covers the page must not leave the page behind it scrollable.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Escape closes whichever thing is open — the drawer on a phone, a dropdown on a desktop.
  // A keyboard user who has opened a dropdown by tabbing into it needs a way out that is not
  // "keep tabbing until it goes away".
  useEffect(() => {
    if (!menuOpen && !openGroup) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setOpenGroup(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, openGroup]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  /** A short delay on close, so the pointer can travel from the trigger into the panel. */
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenGroup(null), 140);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled || menuOpen
          ? "bg-ink/95 backdrop-blur-sm border-b border-ink-line"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <div className="u-container flex items-center justify-between gap-6 py-3 lg:py-4">
        <Link
          href="/"
          className="shrink-0"
          aria-label={`${brand.name} — home`}
          onClick={() => track("nav_click", { destination: "/", location: "header_logo" })}
        >
          <Image
            src={asset("/brand/radha-wordmark-reversed.webp")}
            alt={`${brand.name} — ${brand.tagline}`}
            width={300}
            height={159}
            priority
            className="h-12 w-auto lg:h-16"
          />
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {primaryNav.map((item) => (
              <li
                key={item.href}
                className="relative"
                onMouseEnter={() => {
                  cancelClose();
                  if (item.children) setOpenGroup(item.label);
                }}
                onMouseLeave={scheduleClose}
              >
                <Link
                  href={item.href}
                  className={[
                    "u-eyebrow u-underline inline-block pb-1 transition-colors",
                    isActive(item.href) ? "text-gold-soft" : "text-cream hover:text-gold-soft",
                  ].join(" ")}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  // Always assign, never just when there are children: focusing a childless item
                  // has to clear whatever was open, or tabbing from "Collections" to "Fabric"
                  // leaves the Collections panel hanging open over the page.
                  onFocus={() => setOpenGroup(item.children ? item.label : null)}
                  onClick={() => track("nav_click", { destination: item.href, location: "header" })}
                >
                  {item.label}
                </Link>

                {item.children ? (
                  <div
                    className={[
                      "absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-5 transition-all duration-200",
                      openGroup === item.label
                        ? "visible opacity-100 translate-y-0"
                        : "invisible opacity-0 -translate-y-1",
                    ].join(" ")}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  >
                    <ul className="border border-ink-line bg-ink py-3 shadow-2xl shadow-black/40">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            // The dropdowns are in the DOM at all times, so viewport prefetch
                            // would pull every sub-page on every load. Off here still leaves
                            // Next prefetching on hover, which is when the link is visible
                            // anyway — same perceived speed, twenty fewer requests.
                            prefetch={false}
                            className="block px-6 py-2.5 text-sm text-ink-muted transition-colors hover:bg-ink-soft hover:text-cream"
                            tabIndex={openGroup === item.label ? undefined : -1}
                            onClick={() =>
                              track("nav_click", { destination: child.href, location: "header_dropdown" })
                            }
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={onlineStore.url ?? "/shop"}
            className="u-eyebrow hidden border border-cream/30 px-6 py-3 text-cream transition-colors hover:border-gold hover:text-gold-soft lg:inline-block"
            onClick={() => track("store_click", { location: "header" })}
            {...(onlineStore.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            Shop online
          </Link>

          <Link
            href="/contact"
            className="u-eyebrow hidden bg-gold px-6 py-3 text-ink transition-colors hover:bg-gold-soft lg:inline-block"
            onClick={() => track("nav_click", { destination: "/contact", location: "header_cta" })}
          >
            Enquire
          </Link>

          <button
            type="button"
            className="-mr-2 flex h-11 w-11 items-center justify-center text-cream lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              {menuOpen ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="site-menu"
        hidden={!menuOpen}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-ink-line bg-ink lg:hidden"
      >
        <nav aria-label="Primary (mobile)" className="u-container py-8">
          <ul className="divide-y divide-ink-line">
            {primaryNav.map((item) => (
              <li key={item.href} className="py-6 first:pt-0">
                <Link
                  href={item.href}
                  className="font-display text-3xl text-cream"
                  onClick={() => track("nav_click", { destination: item.href, location: "mobile_menu" })}
                >
                  {item.label}
                </Link>
                {item.blurb ? <p className="mt-2 max-w-sm text-sm text-ink-muted">{item.blurb}</p> : null}
                {item.children ? (
                  <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="u-eyebrow text-gold-soft"
                          onClick={() =>
                            track("nav_click", { destination: child.href, location: "mobile_menu" })
                          }
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3">
            <Link
              href="/contact"
              className="u-eyebrow bg-gold px-8 py-4 text-center text-ink"
              onClick={() => track("nav_click", { destination: "/contact", location: "mobile_menu_cta" })}
            >
              Enquire
            </Link>
            <Link
              href={onlineStore.url ?? "/shop"}
              className="u-eyebrow border border-cream/30 px-8 py-4 text-center text-cream"
              onClick={() => track("store_click", { location: "mobile_menu" })}
              {...(onlineStore.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              Shop online
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
