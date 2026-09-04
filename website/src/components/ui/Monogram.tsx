/**
 * The RADHA monogram.
 *
 * The mark is the one RADHA drew — a serif R whose stem is a shirt placket, with a collar above it
 * and four buttons down it — not a redrawing of it. It is painted through a CSS mask cut from the
 * official artwork, which means it takes `currentColor` like a piece of type: gold on ink, navy on
 * cream, cream at five percent opacity as a watermark, all from one 11 KB file and all crisp at
 * any size.
 *
 * `aria-hidden` throughout. Wherever the mark appears, the name it stands for is already on the
 * page as real text.
 *
 * The mask URL is prefixed by hand. Next rewrites `src` on next/image and hrefs on next/link when
 * a basePath is configured, but it cannot see inside a `url()` in an inline style — so a sub-path
 * deployment would silently lose the mark everywhere it appears.
 */
const MASK = `url(${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/brand/radha-monogram-mask.png)`;

export function Monogram({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-current ${className}`}
      style={{
        WebkitMaskImage: MASK,
        maskImage: MASK,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
