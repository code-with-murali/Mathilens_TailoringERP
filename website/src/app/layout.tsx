import type { Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { ConfigChecklist } from "@/components/ConfigChecklist";
import { MobileActionBar } from "@/components/ContactChannels";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { JsonLd } from "@/components/ui/JsonLd";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { areaServed } from "@/content/region";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";

/**
 * Two families do all the typographic work.
 *
 * Cormorant Garamond is a high-contrast old-style serif, chosen because it is the closest
 * available relative of the letterforms in the RADHA wordmark — the display type on the site and
 * the logo it sits under should look related, not merely adjacent.
 *
 * Inter carries everything else, including the wide-tracked classical caps used for eyebrows and
 * buttons, where its even widths hold up at 0.22em letter-spacing better than a serif would.
 */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata = rootMetadata;

/**
 * Every page opens on the ink hero, so the browser chrome on a phone is told to match it. Without
 * this the address bar stays white above a navy hero, which is the single most common way a
 * carefully composed first screen is spoiled on a phone.
 */
export const viewport: Viewport = {
  themeColor: "#101c2c",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        {/* The organisation and website graphs are site-wide facts, so they live here and every
            page inherits them. Page-specific graphs (breadcrumbs, FAQs, articles) are emitted by
            the page itself and reference this one by @id. */}
        <JsonLd data={[organizationSchema(areaServed), websiteSchema()]} />

        <a
          href="#main"
          className="u-eyebrow sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-gold focus:px-6 focus:py-3 focus:text-ink"
        >
          Skip to content
        </a>

        <SiteHeader />

        {/* The mobile action bar overlaps the foot of the page, so the last section needs room
            underneath it that desktop does not. */}
        <main id="main" className="flex-1 pb-14 lg:pb-0">
          {children}
        </main>

        <SiteFooter />

        <MobileActionBar />
        <ScrollReveal />
        <ConfigChecklist />
        <Analytics />
      </body>
    </html>
  );
}
