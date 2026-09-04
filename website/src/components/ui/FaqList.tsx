import { renderRichText } from "@/components/ui/RichText";
import type { Faq } from "@/content/types";

/**
 * Frequently asked questions.
 *
 * Built on `<details>`/`<summary>` rather than a JavaScript accordion: it is keyboard operable,
 * announced correctly by screen readers, works with the page's find-in-page in modern browsers,
 * and costs nothing to ship. The answer text is in the document either way, which is what matters
 * for the FAQPage structured data the page emits alongside it.
 */
export function FaqList({ faqs, tone = "light" }: { faqs: Faq[]; tone?: "light" | "dark" }) {
  const dark = tone === "dark";

  return (
    <div className={`border-t ${dark ? "border-ink-line" : "border-hair"}`}>
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className={`group border-b ${dark ? "border-ink-line" : "border-hair"}`}
        >
          <summary
            className={[
              "flex cursor-pointer list-none items-start justify-between gap-6 py-6",
              "font-display text-xl sm:text-2xl leading-snug transition-colors",
              dark ? "text-cream hover:text-gold-soft" : "text-ink hover:text-gold-deep",
            ].join(" ")}
          >
            <span>{faq.question}</span>
            <span
              aria-hidden="true"
              className={`mt-2 shrink-0 transition-transform duration-300 group-open:rotate-45 ${
                dark ? "text-gold-soft" : "text-gold"
              }`}
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M8 1v14M1 8h14" />
              </svg>
            </span>
          </summary>
          <p className={`max-w-2xl pb-7 ${dark ? "text-ink-muted" : "text-muted"}`}>
            {renderRichText(faq.answer)}
          </p>
        </details>
      ))}
    </div>
  );
}
