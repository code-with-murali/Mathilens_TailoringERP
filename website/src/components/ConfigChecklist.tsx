import { missingConfiguration } from "@/content/site";

/**
 * A development-only panel listing every value RADHA has not supplied yet.
 *
 * The site's rule is that an unconfigured value removes its feature rather than printing a
 * placeholder at a visitor. That is right for the visitor and terrible for whoever is building
 * the site, who would otherwise have no way of knowing that the call button is missing because
 * the number is missing. This closes that gap, and never renders in a production build.
 */
export function ConfigChecklist() {
  if (process.env.NODE_ENV !== "development") return null;

  const missing = missingConfiguration();
  if (missing.length === 0) return null;

  return (
    <details className="fixed bottom-4 left-4 z-[60] max-w-sm border border-gold bg-ink/95 text-cream shadow-2xl backdrop-blur-sm">
      <summary className="u-eyebrow cursor-pointer list-none px-4 py-3 text-gold-soft">
        {missing.length} value{missing.length === 1 ? "" : "s"} awaiting configuration
      </summary>
      <div className="max-h-72 overflow-y-auto border-t border-ink-line px-4 py-3">
        <p className="mb-3 text-xs leading-relaxed text-ink-muted">
          Each of these removes a feature from the live site until it is set. See{" "}
          <code className="text-gold-soft">.env.example</code> and{" "}
          <code className="text-gold-soft">src/content/site.ts</code>. This panel is development
          only.
        </p>
        <ul className="space-y-2 text-xs text-ink-muted">
          {missing.map((item) => (
            <li key={item} className="border-l border-gold/50 pl-3">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
