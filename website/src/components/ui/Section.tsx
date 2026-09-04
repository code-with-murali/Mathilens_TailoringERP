import type { ReactNode } from "react";

/**
 * A page section, and the only thing on the site that decides a surface colour.
 *
 * Three surfaces exist — cream to read on, paper for plates and photography, ink for the moments
 * that should feel like the inside of a jacket — and a section picks one. Nothing nested inside
 * sets its own background, which is what stops twenty pages drifting into twenty palettes.
 */

type Tone = "cream" | "paper" | "ink";

const toneClass: Record<Tone, string> = {
  cream: "bg-cream text-body",
  paper: "bg-paper text-body",
  ink: "bg-ink text-cream",
};

/** A hairline at the top of the section, in the right colour for the surface. */
const dividerClass: Record<Tone, string> = {
  cream: "border-t border-hair",
  paper: "border-t border-hair",
  ink: "border-t border-ink-line",
};

export function Section({
  children,
  tone = "cream",
  id,
  divider = false,
  flush = false,
  className = "",
  as: Tag = "section",
  labelledBy,
}: {
  children: ReactNode;
  tone?: Tone;
  id?: string;
  /** Draws the hairline that separates two sections sharing a surface colour. */
  divider?: boolean;
  /** Removes the vertical rhythm, for sections that manage their own (heroes, full-bleed plates). */
  flush?: boolean;
  className?: string;
  as?: "section" | "div" | "article" | "aside" | "footer";
  labelledBy?: string;
}) {
  return (
    <Tag
      id={id}
      aria-labelledby={labelledBy}
      className={[
        toneClass[tone],
        divider ? dividerClass[tone] : "",
        flush ? "" : "py-section",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}

/** The standard gutter. Sections that need to break out of it opt out deliberately. */
export function Container({
  children,
  narrow = false,
  className = "",
}: {
  children: ReactNode;
  narrow?: boolean;
  className?: string;
}) {
  return (
    <div className={[narrow ? "u-container-narrow" : "u-container", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
