import { renderRichText } from "@/components/ui/RichText";
import type { Block } from "@/content/types";

/**
 * A stable id for a heading, so the table of contents and the heading itself always agree and an
 * anchor shared today still resolves after the article is edited around it.
 */
export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The h2s of an article, for a table of contents. */
export function headings(body: Block[]) {
  return body
    .filter((block): block is Extract<Block, { type: "h2" }> => block.type === "h2")
    .map((block) => ({ id: headingId(block.text), text: block.text }));
}

/**
 * The renderer for long-form content — journal articles and legal pages.
 *
 * A closed union of block types rather than raw HTML or MDX. Content stays portable to a CMS, the
 * markup a page can produce stays bounded, and nothing in the content layer can inject arbitrary
 * HTML into the document.
 */
export function ContentBlocks({ body }: { body: Block[] }) {
  return (
    <div className="u-prose">
      {body.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              // scroll-margin so the sticky header does not cover a heading arrived at by anchor.
              <h2 key={index} id={headingId(block.text)} className="scroll-mt-28 font-display text-ink">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={index} className="font-display text-ink">
                {block.text}
              </h3>
            );
          case "ul":
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{renderRichText(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={index} className="list-none space-y-3 pl-0">
                {block.items.map((item, itemIndex) => (
                  <li key={item} className="flex gap-4">
                    <span className="font-display text-lg leading-7 text-gold-deep" aria-hidden="true">
                      {String(itemIndex + 1).padStart(2, "0")}
                    </span>
                    <span>{renderRichText(item)}</span>
                  </li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <p
                key={index}
                className="my-10 border-l-2 border-gold bg-cream-deep/50 py-6 pl-7 pr-6 font-display text-xl leading-snug text-ink"
              >
                {renderRichText(block.text)}
              </p>
            );
          default:
            return <p key={index}>{renderRichText(block.text)}</p>;
        }
      })}
    </div>
  );
}
