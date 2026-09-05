"use client";

import { useEffect } from "react";

/**
 * Scroll reveal, mounted once in the layout.
 *
 * A single observer watches every `[data-reveal]` element on the page rather than each element
 * carrying its own client component — which keeps the whole page tree server-rendered and the
 * JavaScript for this effect at a few hundred bytes.
 *
 * Two safeguards matter more than the animation itself. Content is hidden by CSS only, and every
 * rule that hides it is gated on `:root[data-js]` — set by the inline script in the document head.
 * So a bundle that never loads, or loads and throws before this mounts, leaves the page readable
 * instead of blank below the hero; this effect can only ever add the animation, never remove the
 * content. And a reader who has asked for reduced motion is opted out at the CSS layer as well as
 * here.
 */
export function ScrollReveal() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      nodes.forEach((node) => node.setAttribute("data-revealed", ""));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        });
      },
      // Fire a little before the element reaches the fold, so the transition finishes as it
      // arrives rather than starting once it is already in the middle of the screen.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    nodes.forEach((node) => {
      // Anything already on screen at load — the hero, above-the-fold copy — is revealed at once.
      if (node.getBoundingClientRect().top < window.innerHeight) {
        node.setAttribute("data-revealed", "");
        return;
      }
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
