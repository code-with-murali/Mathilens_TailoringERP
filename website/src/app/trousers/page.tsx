import { GarmentPageView } from "@/components/GarmentPageView";
import { garmentBySlug } from "@/content/garments";
import { pageMetadata } from "@/lib/seo";

const garment = garmentBySlug["trousers"];

export const metadata = pageMetadata({
  title: garment.seoTitle,
  description: garment.seoDescription,
  path: garment.path,
  image: garment.ogImage,
});

export default function Page() {
  return <GarmentPageView garment={garment} />;
}
