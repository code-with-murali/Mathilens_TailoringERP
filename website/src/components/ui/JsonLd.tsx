/**
 * Structured data, rendered into the document rather than injected by script.
 *
 * The site is statically exported, so this ships inside the HTML a crawler receives on the first
 * request — no execution required for it to be read.
 */
export function JsonLd({ data }: { data: object | (object | null)[] }) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // The content is built from our own typed builders in lib/schema.ts, never from user
          // input. The escape keeps a stray "</script>" in copy from closing the tag early.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
