import { LegalPageView } from "@/components/LegalPageView";
import { legalBySlug } from "@/content/legal";
import { pageMetadata } from "@/lib/seo";

const page = legalBySlug["terms"];

export const metadata = pageMetadata({
  title: page.seoTitle,
  description: page.description,
  path: page.path,
});

export default function Page() {
  return <LegalPageView page={page} />;
}
