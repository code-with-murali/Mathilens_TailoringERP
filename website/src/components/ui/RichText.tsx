import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Inline links inside body copy.
 *
 * Content is plain strings so it stays portable to a CMS, but a page of prose with no links out of
 * it wastes the most valuable internal-linking surface a site has: a link inside a sentence, in
 * context, with the anchor text a reader would actually use. So body strings may contain a
 * markdown-style link and nothing else:
 *
 *     "A blazer is not [half a suit](/suits) — it is drafted to stand alone."
 *
 * Deliberately one syntax and no more. Nothing in the content layer can emit arbitrary markup,
 * and there is no markdown dependency to keep current.
 *
 * Links are internal by convention. An href starting with "http" renders as a plain anchor with
 * the usual safety attributes, so the same copy works if an external reference is ever needed.
 */

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export function renderRichText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  LINK.lastIndex = 0;
  while ((match = LINK.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

    const [, label, href] = match;
    nodes.push(
      href.startsWith("http") ? (
        <a
          key={`${href}-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="u-underline text-gold-deep hover:text-ink"
        >
          {label}
        </a>
      ) : (
        <Link
          key={`${href}-${match.index}`}
          href={href}
          className="u-underline text-gold-deep hover:text-ink"
        >
          {label}
        </Link>
      ),
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** A paragraph of body copy that may contain inline links. */
export function RichParagraph({ text, className = "" }: { text: string; className?: string }) {
  return <p className={className}>{renderRichText(text)}</p>;
}
