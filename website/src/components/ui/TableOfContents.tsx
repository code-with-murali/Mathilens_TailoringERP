import Link from "next/link";

/**
 * The contents of a long article.
 *
 * Two reasons it earns its place on a journal that averages a seven-minute read. A reader scanning
 * on a phone can see whether the piece answers their question before committing to it — and Google
 * uses in-page anchors to offer "jump to" links under a result, which is free extra surface area
 * in the SERP for an article that has genuinely distinct sections.
 *
 * Rendered as a nav with a real list, and only when there are enough sections to be worth it.
 */
export function TableOfContents({ items }: { items: { id: string; text: string }[] }) {
  if (items.length < 3) return null;

  // Some articles number their own sections ("1. The shoulder"). Adding a second set of numerals
  // beside those reads as a mistake, so the marker becomes a rule instead — and the link text
  // stays byte-identical to the heading it jumps to, which is what a jump link needs.
  const selfNumbered = items.some((item) => /^\d+[.)]\s/.test(item.text));

  return (
    <nav aria-labelledby="contents-heading" className="border-t-2 border-gold pt-7">
      <h2 id="contents-heading" className="u-eyebrow text-gold-deep">
        In this article
      </h2>
      <ol className="mt-5 space-y-2.5">
        {items.map((item, index) => (
          <li key={item.id} className="flex gap-4">
            {selfNumbered ? (
              <span aria-hidden="true" className="mt-3 h-px w-3 shrink-0 bg-gold" />
            ) : (
              <span aria-hidden="true" className="font-display text-sm leading-6 text-gold-deep">
                {String(index + 1).padStart(2, "0")}
              </span>
            )}
            <Link
              href={`#${item.id}`}
              className="u-underline text-ink transition-colors hover:text-gold-deep"
            >
              {item.text}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
