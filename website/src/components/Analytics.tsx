import Script from "next/script";
import { analyticsId } from "@/content/site";

/**
 * Google Analytics 4.
 *
 * Nothing is loaded unless NEXT_PUBLIC_GA4_ID is set, so a development build and an unconfigured
 * deployment ship no third-party JavaScript at all — which is both the honest behaviour and the
 * fast one.
 *
 * `afterInteractive` rather than `beforeInteractive`: analytics must never sit in front of the
 * page's own rendering, and the few hundred milliseconds cost nothing to a measurement tag.
 */
export function Analytics() {
  if (!analyticsId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${analyticsId}');`}
      </Script>
    </>
  );
}
