import Link from "next/link";
import { Arrow } from "@/components/ui/CtaLink";
import { Monogram } from "@/components/ui/Monogram";
import { Plate } from "@/components/ui/Plate";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { testimonials, testimonialsCopy } from "@/content/testimonials";
import type { Detail, GarmentPage, JournalPost } from "@/content/types";
import type { ProcessStep } from "@/content/process";

/**
 * The repeated compositions.
 *
 * Each of these appears on the home page and again on at least one inner page. Keeping them here
 * rather than inside a page means the category card on the home page and the category card on
 * /services are the same card, and stay the same card when one of them is changed.
 */

/** A category card: plate or photograph, name, one line, and the whole thing is the link. */
export function CategoryCard({
  href,
  title,
  description,
  cta,
  plate,
  image,
  ratio = "portrait",
  priority = false,
  index = 0,
}: {
  href: string;
  title: string;
  description: string;
  cta: string;
  plate: GarmentPage["plate"];
  image?: GarmentPage["image"];
  ratio?: "portrait" | "landscape" | "square" | "tall";
  priority?: boolean;
  index?: number;
}) {
  return (
    <article
      data-reveal
      style={{ ["--reveal-delay" as string]: `${Math.min(index, 4) * 90}ms` }}
      className="group"
    >
      {/* A column, so the call to action sits on the same line across a row whatever length the
          descriptions happen to be. Ragged CTAs are the fastest way to make a grid look unmade. */}
      <TrackedLink
        href={href}
        event="category_click"
        params={{ category: title, position: String(index + 1) }}
        className="flex h-full flex-col focus-visible:outline-offset-4"
      >
        <Plate
          plate={plate}
          image={image}
          ratio={ratio}
          priority={priority}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
        />
        <h3 className="mt-7 text-subtitle text-ink">{title}</h3>
        <p className="mt-3 max-w-sm text-muted">{description}</p>
        <span className="u-eyebrow mt-auto inline-flex items-center gap-3 pt-6 text-gold-deep transition-colors group-hover:text-ink">
          {cta}
          <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
        </span>
      </TrackedLink>
    </article>
  );
}

/** A card that is not a garment — bulk orders, or anything else worth standing beside them. */
export type ExtraCard = {
  href: string;
  title: string;
  description: string;
  cta: string;
  plate: GarmentPage["plate"];
};

export function CategoryGrid({
  garments,
  extra = [],
}: {
  garments: GarmentPage[];
  /** Appended after the garments — used to complete the three-column grid rather than leave a hole. */
  extra?: ExtraCard[];
}) {
  return (
    <div className="grid items-stretch gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {garments.map((garment, index) => (
        <CategoryCard
          key={garment.slug}
          href={garment.path}
          title={garment.title}
          description={garment.cardDescription}
          cta={garment.cardCta}
          plate={garment.plate}
          image={garment.image}
          index={index}
          priority={index === 0}
        />
      ))}
      {extra.map((card, index) => (
        <CategoryCard key={card.href} {...card} index={garments.length + index} />
      ))}
    </div>
  );
}

/**
 * A grid of short titled notes — the decisions on a garment page, the pillars on the home page,
 * the considerations on a bulk page. A gold hairline above each, and nothing else: no card, no
 * shadow, no rounded corner. The whitespace does the separating.
 */
export function DetailGrid({
  details,
  columns = 4,
  tone = "light",
}: {
  details: Detail[];
  columns?: 2 | 3 | 4;
  tone?: "light" | "dark";
}) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={`grid gap-x-8 gap-y-10 ${cols}`}>
      {details.map((detail, index) => (
        <div
          key={detail.title}
          data-reveal
          style={{ ["--reveal-delay" as string]: `${Math.min(index, 6) * 70}ms` }}
          className={`border-t pt-6 ${tone === "dark" ? "border-ink-line" : "border-hair"}`}
        >
          <h3
            className={`font-display text-xl ${tone === "dark" ? "text-cream" : "text-ink"}`}
          >
            {detail.title}
          </h3>
          <p className={`mt-3 text-sm leading-relaxed ${tone === "dark" ? "text-ink-muted" : "text-muted"}`}>
            {detail.text}
          </p>
        </div>
      ))}
    </div>
  );
}

/** The seven steps. The number is the design — set large, in the display serif, in gold. */
export function ProcessList({ steps, tone = "light" }: { steps: ProcessStep[]; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <ol className={`border-t ${dark ? "border-ink-line" : "border-hair"}`}>
      {steps.map((step, index) => (
        <li
          key={step.number}
          data-reveal
          style={{ ["--reveal-delay" as string]: `${Math.min(index, 6) * 60}ms` }}
          className={`grid gap-x-10 gap-y-4 border-b py-9 md:grid-cols-[6rem_minmax(0,18rem)_minmax(0,1fr)] ${
            dark ? "border-ink-line" : "border-hair"
          }`}
        >
          <span
            aria-hidden="true"
            className={`font-display text-4xl leading-none ${dark ? "text-gold-soft/70" : "text-gold-deep"}`}
          >
            {step.number}
          </span>
          <div>
            <h3 className={`text-subtitle ${dark ? "text-cream" : "text-ink"}`}>{step.title}</h3>
            <p className={`mt-2 text-sm ${dark ? "text-gold-soft" : "text-gold-deep"}`}>{step.summary}</p>
          </div>
          <p className={dark ? "text-ink-muted" : "text-muted"}>{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}

/** Article cards. Used on the home page (three) and on /journal (all of them). */
export function JournalGrid({ posts }: { posts: JournalPost[] }) {
  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => (
        <article
          key={post.slug}
          data-reveal
          style={{ ["--reveal-delay" as string]: `${Math.min(index, 4) * 80}ms` }}
          className="group border-t border-hair pt-7"
        >
          <p className="u-eyebrow text-gold-deep">{post.category}</p>
          <h3 className="mt-4 text-subtitle">
            <TrackedLink
              href={`/journal/${post.slug}`}
              event="journal_click"
              params={{ article: post.slug, source: "grid" }}
              className="text-ink transition-colors group-hover:text-gold-deep"
            >
              {post.title}
            </TrackedLink>
          </h3>
          <p className="mt-4 text-muted">{post.description}</p>
          <p className="u-eyebrow mt-6 text-muted">{post.readingMinutes} min read</p>
        </article>
      ))}
    </div>
  );
}

/**
 * Customer stories.
 *
 * Renders the honest empty state until `testimonials` contains verified, permissioned quotes — see
 * the note in content/testimonials.ts. Publishing invented praise is the one thing that would cost
 * this brand more than having none.
 */
export function Testimonials({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";

  if (testimonials.length === 0) {
    return (
      <div data-reveal className={`border-l-2 pl-8 ${dark ? "border-gold/60" : "border-gold"}`}>
        <Monogram className={`h-10 w-10 ${dark ? "text-gold-soft/60" : "text-gold/70"}`} />
        <p className={`mt-7 max-w-2xl text-lead ${dark ? "text-ink-muted" : "text-muted"}`}>
          {testimonialsCopy.emptyLead}
        </p>
        <p className={`mt-5 max-w-2xl ${dark ? "text-cream" : "text-ink"}`}>{testimonialsCopy.emptyCta}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((testimonial, index) => (
        <figure
          key={`${testimonial.name}-${index}`}
          data-reveal
          style={{ ["--reveal-delay" as string]: `${Math.min(index, 4) * 80}ms` }}
          className={`border-t pt-7 ${dark ? "border-ink-line" : "border-hair"}`}
        >
          <blockquote className={`font-display text-xl leading-snug ${dark ? "text-cream" : "text-ink"}`}>
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>
          <figcaption className={`mt-6 text-sm ${dark ? "text-ink-muted" : "text-muted"}`}>
            <span className={dark ? "text-cream" : "text-ink"}>{testimonial.name}</span>
            {testimonial.profession ? ` — ${testimonial.profession}` : ""}
            {testimonial.location ? `, ${testimonial.location}` : ""}
            {testimonial.garment ? (
              <span className="u-eyebrow mt-3 block text-gold-deep">{testimonial.garment}</span>
            ) : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** "Read next" links between related garment and journal pages. */
export function RelatedLinks({
  title = "Continue",
  links,
}: {
  title?: string;
  links: { label: string; href: string; note?: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <div data-reveal>
      <p className="u-eyebrow text-gold-deep">{title}</p>
      <ul className="mt-7 border-t border-hair">
        {links.map((link) => (
          <li key={link.href} className="border-b border-hair">
            <Link
              href={link.href}
              className="group flex items-baseline justify-between gap-6 py-5 transition-colors hover:text-gold-deep"
            >
              <span className="font-display text-xl text-ink transition-colors group-hover:text-gold-deep">
                {link.label}
                {link.note ? <span className="ml-3 text-sm text-muted">{link.note}</span> : null}
              </span>
              <Arrow className="shrink-0 text-gold-deep transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
