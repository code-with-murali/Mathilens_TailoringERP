import type { ReactNode } from "react";

/**
 * The heading block that opens a section: an eyebrow, a display-serif title, a gold hairline and
 * an optional lead paragraph.
 *
 * The eyebrow is a `<p>`, not a heading — it is a label, and letting it be an `<h3>` above an
 * `<h2>` is the most common way a page ends up with a heading order that reads as nonsense to a
 * screen reader. The real heading level is passed in, so a page author has to think about it.
 */

type Tone = "light" | "dark";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  level = 2,
  id,
  tone = "light",
  align = "left",
  children,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  /** 1 for a page's single H1, 2 for a section, 3 for a subsection. */
  level?: 1 | 2 | 3;
  id?: string;
  tone?: Tone;
  align?: "left" | "center";
  children?: ReactNode;
  className?: string;
}) {
  const Heading = `h${level}` as "h1" | "h2" | "h3";
  const dark = tone === "dark";

  const size =
    level === 1
      ? "text-display"
      : level === 2
        ? "text-title"
        : "text-subtitle";

  return (
    <div
      className={[
        align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-3xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow ? (
        <p className={`u-eyebrow mb-5 ${dark ? "text-gold-soft" : "text-gold-deep"}`}>{eyebrow}</p>
      ) : null}

      <Heading id={id} className={`${size} ${dark ? "text-cream" : "text-ink"}`}>
        {title}
      </Heading>

      <div
        className={`u-rule mt-7 w-24 ${align === "center" ? "mx-auto" : ""}`}
        aria-hidden="true"
      />

      {lead ? (
        <p className={`mt-7 text-lead ${dark ? "text-ink-muted" : "text-muted"}`}>{lead}</p>
      ) : null}

      {children}
    </div>
  );
}
