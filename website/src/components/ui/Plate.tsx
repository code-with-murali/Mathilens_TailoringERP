import Image from "next/image";
import { Monogram } from "@/components/ui/Monogram";
import type { ImageAsset, Plate as PlateSpec } from "@/content/types";
import { asset } from "@/lib/asset";

/**
 * The image slot for a category, a garment or a story.
 *
 * There is exactly one photographic subject in the supplied brand assets. Rather than fill the
 * gaps with stock photography of somebody else's tailoring — which would be a lie about the work
 * and obvious to anyone who has seen a stock library — a category without a photograph gets a
 * plate: a woven navy or cream panel carrying the monogram and the category name, set in the
 * display serif.
 *
 * The point is that it looks like a deliberate typographic treatment rather than a missing image.
 * When real photography exists, adding `image` to the same content object replaces the plate
 * everywhere it appears, with no component change.
 */

const toneClass: Record<PlateSpec["tone"], string> = {
  ink: "bg-ink text-cream",
  cream: "bg-cream-deep text-ink",
  gold: "bg-ink text-gold-soft",
};

const motifClass: Record<PlateSpec["tone"], string> = {
  ink: "text-cream/70",
  cream: "text-ink/60",
  gold: "text-gold-soft/80",
};

export function Plate({
  image,
  plate,
  ratio = "portrait",
  priority = false,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  className = "",
}: {
  image?: ImageAsset;
  plate: PlateSpec;
  ratio?: "portrait" | "landscape" | "square" | "tall";
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const ratioClass = {
    portrait: "aspect-[4/5]",
    landscape: "aspect-[16/10]",
    square: "aspect-square",
    tall: "aspect-[3/4] sm:aspect-[2/3]",
  }[ratio];

  if (image) {
    return (
      <div className={`relative overflow-hidden ${ratioClass} ${className}`}>
        <Image
          src={asset(image.src)}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${ratioClass} ${toneClass[plate.tone]} ${className}`}
      // Decorative: the category name is always rendered as real text beside the plate, so the
      // plate itself carries no information a screen reader needs.
      role="presentation"
    >
      <div className="u-weave absolute inset-0" aria-hidden="true" />
      <div
        className="absolute inset-4 border border-current opacity-20"
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6">
        <Monogram className={`h-16 w-16 sm:h-20 sm:w-20 ${motifClass[plate.tone]}`} />
        <span
          className={`font-display text-center text-2xl sm:text-3xl tracking-[0.06em] ${motifClass[plate.tone]}`}
          aria-hidden="true"
        >
          {plate.motif}
        </span>
      </div>
    </div>
  );
}
