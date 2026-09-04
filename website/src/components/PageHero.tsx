import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Monogram } from "@/components/ui/Monogram";
import type { Crumb } from "@/content/types";

/**
 * The opening of every page except the home page.
 *
 * It is always ink, which is what allows the header to sit transparently over the top of the
 * document on every route. The monogram is set very large and very faint behind the type — the
 * brand's own mark used as a texture, which is a cheaper and more distinctive way to fill a hero
 * than photography we do not have.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-cream">
      <div className="u-weave absolute inset-0 text-cream opacity-70" aria-hidden="true" />
      <Monogram
        className="pointer-events-none absolute -right-16 -top-10 h-[26rem] w-[26rem] text-cream opacity-[0.045] sm:-right-8 sm:h-[34rem] sm:w-[34rem]"
      />

      <div className="u-container relative pb-20 pt-32 sm:pb-24 sm:pt-40 lg:pb-32 lg:pt-48">
        <Breadcrumbs crumbs={crumbs} tone="dark" />

        <p className="u-eyebrow mt-10 text-gold-soft">{eyebrow}</p>

        <h1 className="mt-6 max-w-4xl text-display text-cream">{title}</h1>

        <div className="u-rule mt-9 w-28" aria-hidden="true" />

        {lead ? <p className="mt-9 max-w-2xl text-lead text-ink-muted">{lead}</p> : null}

        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}
