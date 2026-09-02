import type { Dims, Figure, GarmentSpec } from "@/lib/simulator/model";
import { isPale, shade } from "@/lib/simulator/model";

/**
 * A flat technical drawing of one garment, in one view, at one customer's measurements.
 *
 * <p>Everything here is drawn in centimetres and scaled by the viewBox, so the numbers in the code
 * are the numbers on the tape. The one conversion that matters is that a garment laid flat is half
 * its round measure across — a 100cm chest draws 50cm wide — which is why circumferences are
 * divided by two for a width and by four for a distance from the centre line.</p>
 *
 * <p>This is deliberately a flat, not a figure. A tailor's own pattern is drawn flat, a customer
 * can see the shape of what they are buying, and above all it is honest: every line moves when a
 * measurement moves, so nothing on screen is claiming a fit the numbers do not support.</p>
 */
export function GarmentDrawing({
  garment,
  view,
  dims,
  color,
  figure,
}: {
  garment: GarmentSpec;
  view: string;
  dims: Dims;
  color: string;
  /** Show it worn by this man. Omitted on the detail views, which are of cloth, not of a person. */
  figure?: Figure;
}) {
  const palette = {
    fill: color,
    // Panels that sit on top of the fabric — a placket, a cuff, a pocket flap — are the same cloth
    // catching the light differently, so they are the fabric shifted rather than a colour of their own.
    panel: shade(color, isPale(color) ? 0.09 : -0.1),
    seam: shade(color, isPale(color) ? 0.42 : -0.4),
    line: shade(color, isPale(color) ? 0.62 : -0.62),
  };

  const scene = buildScene(garment, view, dims, palette, figure);

  return (
    <svg
      viewBox={scene.viewBox}
      role="img"
      aria-label={`${garment.label}, ${view} view`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {scene.content}
    </svg>
  );
}

type Palette = { fill: string; panel: string; seam: string; line: string };

type Scene = { viewBox: string; content: React.ReactNode };

/** Centimetres to a distance from the centre line: a quarter of a circumference. */
const q = (circumference: number) => circumference / 4;

/** Centimetres to a flat width: half a circumference. */
const flat = (circumference: number) => circumference / 2;

/**
 * How far a sleeve falls from the shoulder in a flat drawing — about 38 degrees.
 *
 * One constant rather than two, because the cuff is drawn square across the sleeve using the
 * perpendicular of this same direction. Written twice, a change to the angle would leave the cuff
 * cutting the sleeve at a slant and reading as a fold.
 */
const SLEEVE = { cos: 0.79, sin: 0.61 };

const box = (minX: number, minY: number, width: number, height: number) =>
  `${minX.toFixed(1)} ${minY.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)}`;

function buildScene(garment: GarmentSpec, view: string, d: Dims, p: Palette, figure?: Figure): Scene {
  if (garment.id === "trousers") {
    switch (view) {
      case "waistband":
        return waistbandDetail(d, p);
      case "pocket":
        return pocketDetail(d, p);
      case "hem":
        return hemDetail(d, p);
      default:
        return trousers(d, p, view === "back", figure);
    }
  }

  switch (view) {
    case "collar":
      return garment.id === "blazer" || garment.id === "suit" ? lapelDetail(d, p) : collarDetail(d, p, garment.id === "kurta");
    case "sleeve":
      return sleeveDetail(d, p, garment.id === "blazer" || garment.id === "suit");
    case "cuff":
      return cuffDetail(d, p);
    case "pocket":
      return pocketDetail(d, p);
    case "hem":
      return slitDetail(d, p);
    case "trousers":
      return trousers(d, p, false, figure);
    default:
      return torso(garment, d, p, view === "back", figure);
  }
}

// ---------------------------------------------------------------------------------------------
// The man wearing it
// ---------------------------------------------------------------------------------------------

/**
 * Proportions for the figure, from his height alone.
 *
 * The classical seven-and-a-half heads: it is what makes a drawn body read as a body rather than a
 * shape, and it means one number produces a whole man. Nothing here touches the garment — the
 * clothes are cut from the measurements and drawn on top, so a taller figure never silently makes
 * the shirt bigger.
 */
function figureParts(figure: Figure) {
  const head = figure.heightCm / 7.5;
  const bulk = figure.weight === "lean" ? 0.88 : figure.weight === "heavy" ? 1.16 : 1;
  return {
    headHeight: head,
    headWidth: head * 0.68,
    neckLength: head * 0.34,
    neckWidth: head * 0.42 * bulk,
    armWidth: head * 0.36 * bulk,
    wristWidth: head * 0.2 * bulk,
    legWidth: head * 0.52 * bulk,
    ankleWidth: head * 0.28 * bulk,
    legLength: figure.heightCm * 0.46,
  };
}

/**
 * Head, neck, arms and legs, drawn behind the garment so the cloth covers what it would cover.
 *
 * <p>Limbs follow the same sleeve angle the garment uses, so an arm is never left sticking out of
 * its own sleeve. Everything is one flat skin tone with a soft outline — detail on a face would
 * pull the eye away from the cloth, which is the thing actually being sold, and a drawn face
 * invites a comparison with the customer that no illustration wins.</p>
 */
function Body({
  figure,
  shoulderHalf,
  hipHalf,
  crotchY,
  sleeveEnd,
  skinLine,
}: {
  figure: Figure;
  shoulderHalf: number;
  hipHalf: number;
  crotchY: number;
  sleeveEnd: { x: number; y: number } | null;
  skinLine: string;
}) {
  const f = figureParts(figure);
  const armStart = shoulderHalf * 0.9;
  const stroke = { stroke: skinLine, strokeWidth: 0.7, strokeLinejoin: "round" as const };

  // Arms reach past the cuff by a hand's worth, so a short sleeve shows forearm and a long one
  // shows only the hand.
  const arm = sleeveEnd
    ? { x: sleeveEnd.x + f.armWidth * 0.4, y: sleeveEnd.y + f.armWidth * 1.6 }
    : { x: armStart + 6, y: crotchY * 0.75 };

  const legTop = crotchY - 2;
  const legInner = 1.2;
  const legOuter = hipHalf * 0.92;
  const footY = legTop + f.legLength;

  return (
    <g>
      {/* Legs */}
      {[1, -1].map((side) => (
        <path
          key={`leg${side}`}
          d={`M ${side * legInner} ${legTop} L ${side * legOuter} ${legTop} L ${side * (f.ankleWidth + legInner)} ${footY} L ${side * legInner} ${footY} Z`}
          fill={figure.skin}
          {...stroke}
        />
      ))}

      {/* Arms, along the sleeve's own line */}
      {[1, -1].map((side) => (
        <path
          key={`arm${side}`}
          d={`M ${side * armStart} 0 L ${side * (armStart + f.armWidth)} 0 L ${side * (arm.x + f.wristWidth)} ${arm.y} L ${side * arm.x} ${arm.y} Z`}
          fill={figure.skin}
          {...stroke}
        />
      ))}

      {/* Torso, so the neck opening and any gap at the hem show skin rather than the page */}
      <path
        d={`M ${-shoulderHalf * 0.8} 0 L ${shoulderHalf * 0.8} 0 L ${hipHalf * 0.8} ${legTop} L ${-hipHalf * 0.8} ${legTop} Z`}
        fill={figure.skin}
        {...stroke}
      />

      <rect x={-f.neckWidth / 2} y={-f.neckLength - 1} width={f.neckWidth} height={f.neckLength + 3} fill={figure.skin} {...stroke} />
      <ellipse
        cx={0}
        cy={-f.neckLength - f.headHeight / 2}
        rx={f.headWidth / 2}
        ry={f.headHeight / 2}
        fill={figure.skin}
        {...stroke}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Upper body
// ---------------------------------------------------------------------------------------------

type TorsoGeometry = {
  shoulderHalf: number;
  chestHalf: number;
  waistHalf: number;
  hipHalf: number;
  neckHalf: number;
  neckDrop: number;
  shoulderY: number;
  chestY: number;
  waistY: number;
  hemY: number;
  sleeveEnd: { x: number; y: number };
  cuffFlat: number;
};

function torsoGeometry(d: Dims): TorsoGeometry {
  const shoulderHalf = d.shoulder / 2;
  const neckHalf = d.neck / 6;
  const neckDrop = d.neck / 11;
  // The shoulder falls away from the neck; without the slope every garment reads as a box.
  const shoulderY = neckDrop + d.shoulder / 12;
  const chestY = shoulderY + d.armhole / 2.6;
  const hemY = d.length;
  const waistY = Math.min(chestY + (hemY - chestY) * 0.52, hemY - 6);

  const dx = d.sleeve * SLEEVE.cos;
  const dy = d.sleeve * SLEEVE.sin;

  return {
    shoulderHalf,
    chestHalf: q(d.chest),
    waistHalf: q(d.waist),
    hipHalf: q(d.hip),
    neckHalf,
    neckDrop,
    shoulderY,
    chestY,
    waistY,
    hemY,
    sleeveEnd: { x: shoulderHalf + dx, y: shoulderY + dy },
    cuffFlat: flat(d.cuff),
  };
}

/** Half the body outline, from the centre of the neck down to the centre of the hem, on one side. */
function bodyHalf(g: TorsoGeometry, sign: number, hemHalf: number): string {
  const s = (n: number) => (n * sign).toFixed(2);
  return [
    `M 0 ${g.neckDrop.toFixed(2)}`,
    `C ${s(g.neckHalf * 0.6)} ${g.neckDrop.toFixed(2)} ${s(g.neckHalf)} ${(g.neckDrop * 0.35).toFixed(2)} ${s(g.neckHalf)} 0`,
    `L ${s(g.shoulderHalf)} ${g.shoulderY.toFixed(2)}`,
    // The armhole scoops in before the side seam picks up, which is what stops a sleeve looking
    // stuck on to a rectangle.
    `C ${s(g.shoulderHalf * 0.94)} ${(g.shoulderY + (g.chestY - g.shoulderY) * 0.55).toFixed(2)} ${s(g.chestHalf)} ${(g.chestY - 3).toFixed(2)} ${s(g.chestHalf)} ${g.chestY.toFixed(2)}`,
    `C ${s(g.chestHalf)} ${(g.chestY + (g.waistY - g.chestY) * 0.5).toFixed(2)} ${s(g.waistHalf)} ${(g.waistY - 4).toFixed(2)} ${s(g.waistHalf)} ${g.waistY.toFixed(2)}`,
    `C ${s(g.waistHalf)} ${(g.waistY + (g.hemY - g.waistY) * 0.55).toFixed(2)} ${s(hemHalf)} ${(g.hemY - 6).toFixed(2)} ${s(hemHalf)} ${g.hemY.toFixed(2)}`,
  ].join(" ");
}

function sleevePath(g: TorsoGeometry, sign: number): string {
  const s = (n: number) => (n * sign).toFixed(2);
  // Perpendicular to the sleeve's own direction, so the cuff sits square across the arm rather
  // than horizontally — a horizontal cuff on an angled sleeve reads as a fold.
  const px = -SLEEVE.sin * g.cuffFlat;
  const py = SLEEVE.cos * g.cuffFlat;

  return [
    `M ${s(g.shoulderHalf)} ${g.shoulderY.toFixed(2)}`,
    `L ${s(g.sleeveEnd.x)} ${g.sleeveEnd.y.toFixed(2)}`,
    `L ${s(g.sleeveEnd.x + px)} ${(g.sleeveEnd.y + py).toFixed(2)}`,
    `L ${s(g.chestHalf)} ${g.chestY.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function torso(garment: GarmentSpec, d: Dims, p: Palette, isBack: boolean, figure?: Figure): Scene {
  const g = torsoGeometry(d);
  const hemHalf = garment.id === "kurta" ? q(d.bottom) : g.hipHalf;
  const stroke = { stroke: p.line, strokeWidth: 0.9, strokeLinejoin: "round" as const };
  const skinLine = p.line;

  // Built as one half traced down, across the hem, and back up its mirror, so the two sides cannot
  // drift apart as the measurements change.
  const outline = `${bodyHalf(g, 1, hemHalf)} L ${(-hemHalf).toFixed(2)} ${g.hemY.toFixed(2)} ${reverseHalf(g)} Z`;

  // The figure's own extent, so a head is never clipped and a tall man's legs are not cut off at
  // the ankle. Without a figure the frame stays tight to the garment, as it was.
  const parts = figure ? figureParts(figure) : null;
  const crotchY = Math.max(g.hemY + 2, g.waistY + 14);
  const topY = parts ? -(parts.neckLength + parts.headHeight) - 6 : -8;
  const bottomY = parts ? crotchY + parts.legLength + 8 : Math.max(g.hemY, g.sleeveEnd.y + g.cuffFlat) + 6;

  const width = Math.max(g.sleeveEnd.x, hemHalf, g.chestHalf) * 2 + 12;
  const height = bottomY - topY;

  return {
    viewBox: box(-width / 2, topY, width, height),
    content: (
      <g>
        {figure && (
          <Body
            figure={figure}
            shoulderHalf={g.shoulderHalf}
            hipHalf={g.hipHalf}
            crotchY={crotchY}
            sleeveEnd={g.sleeveEnd}
            skinLine={skinLine}
          />
        )}
        <path d={sleevePath(g, 1)} fill={p.fill} {...stroke} />
        <path d={sleevePath(g, -1)} fill={p.fill} {...stroke} />
        <path d={outline} fill={p.fill} {...stroke} />

        {/* The armhole seam — the join the sleeve is actually set into. */}
        <path
          d={`M ${g.shoulderHalf.toFixed(2)} ${g.shoulderY.toFixed(2)} L ${g.chestHalf.toFixed(2)} ${g.chestY.toFixed(2)}`}
          fill="none"
          stroke={p.seam}
          strokeWidth={0.6}
        />
        <path
          d={`M ${(-g.shoulderHalf).toFixed(2)} ${g.shoulderY.toFixed(2)} L ${(-g.chestHalf).toFixed(2)} ${g.chestY.toFixed(2)}`}
          fill="none"
          stroke={p.seam}
          strokeWidth={0.6}
        />

        {isBack ? (
          <BackDetail g={g} d={d} p={p} garment={garment} hemHalf={hemHalf} />
        ) : (
          <FrontDetail g={g} d={d} p={p} garment={garment} />
        )}
      </g>
    ),
  };
}

/**
 * The mirrored half, written back-to-front so the outline closes as one path.
 *
 * Takes no hem width: the caller has already drawn the line across the hem, so this picks the
 * outline up at the far hem corner and climbs back to the neck.
 */
function reverseHalf(g: TorsoGeometry): string {
  return [
    `L ${(-g.waistHalf).toFixed(2)} ${g.waistY.toFixed(2)}`,
    `L ${(-g.chestHalf).toFixed(2)} ${g.chestY.toFixed(2)}`,
    `L ${(-g.shoulderHalf).toFixed(2)} ${g.shoulderY.toFixed(2)}`,
    `L ${(-g.neckHalf).toFixed(2)} 0`,
    `C ${(-g.neckHalf).toFixed(2)} ${(g.neckDrop * 0.35).toFixed(2)} ${(-g.neckHalf * 0.6).toFixed(2)} ${g.neckDrop.toFixed(2)} 0 ${g.neckDrop.toFixed(2)}`,
  ].join(" ");
}

function FrontDetail({ g, d, p, garment }: { g: TorsoGeometry; d: Dims; p: Palette; garment: GarmentSpec }) {
  const tailored = garment.id === "blazer" || garment.id === "suit";
  const placketHalf = tailored ? 0 : 1.8;
  const buttons = Math.max(3, Math.round((g.hemY - g.neckDrop) / 11));

  if (tailored) {
    const lapelDrop = g.chestY + 6;
    return (
      <g>
        {/* A jacket breaks open at the lapel instead of running a placket to the neck. */}
        <path
          d={`M ${g.neckHalf.toFixed(2)} 0 L ${(g.neckHalf + d.lapel).toFixed(2)} ${(g.chestY * 0.55).toFixed(2)} L 1.2 ${lapelDrop.toFixed(2)} L 1.2 ${g.hemY.toFixed(2)}`}
          fill={p.panel}
          stroke={p.seam}
          strokeWidth={0.7}
        />
        <path
          d={`M ${(-g.neckHalf).toFixed(2)} 0 L ${(-g.neckHalf - d.lapel).toFixed(2)} ${(g.chestY * 0.55).toFixed(2)} L -1.2 ${lapelDrop.toFixed(2)} L -1.2 ${g.hemY.toFixed(2)}`}
          fill={p.panel}
          stroke={p.seam}
          strokeWidth={0.7}
        />
        <circle cx={-2.5} cy={lapelDrop + 5} r={0.9} fill={p.line} />
        <circle cx={-2.5} cy={lapelDrop + 15} r={0.9} fill={p.line} />
        {/* Welt pockets, set at the hip the way a jacket's are. */}
        <rect x={g.waistHalf * 0.25} y={g.waistY + 6} width={11} height={1.6} fill={p.panel} stroke={p.seam} strokeWidth={0.5} />
        <rect x={-g.waistHalf * 0.25 - 11} y={g.waistY + 6} width={11} height={1.6} fill={p.panel} stroke={p.seam} strokeWidth={0.5} />
        <CollarBand g={g} p={p} />
      </g>
    );
  }

  return (
    <g>
      {/* Button placket down the centre front. */}
      <rect
        x={-placketHalf}
        y={g.neckDrop}
        width={placketHalf * 2}
        height={g.hemY - g.neckDrop}
        fill={p.panel}
        stroke={p.seam}
        strokeWidth={0.5}
      />
      {Array.from({ length: buttons }, (_, i) => (
        <circle key={i} cx={0} cy={g.neckDrop + 7 + i * ((g.hemY - g.neckDrop - 10) / Math.max(1, buttons - 1))} r={0.85} fill={p.line} />
      ))}
      {garment.id === "shirt" && (
        // Chest pocket, on the wearer's left — which is the right of the drawing, since a flat is
        // seen from the front.
        <rect
          x={-g.chestHalf * 0.62 - 6}
          y={g.chestY + 6}
          width={12}
          height={13}
          rx={0.8}
          fill={p.panel}
          stroke={p.seam}
          strokeWidth={0.6}
        />
      )}
      <CollarBand g={g} p={p} />
    </g>
  );
}

function BackDetail({
  g,
  d,
  p,
  garment,
  hemHalf,
}: {
  g: TorsoGeometry;
  d: Dims;
  p: Palette;
  garment: GarmentSpec;
  hemHalf: number;
}) {
  const yokeY = g.shoulderY + d.armhole / 7;
  return (
    <g>
      {garment.id === "shirt" && (
        // The yoke: the panel across the shoulders that a shirt back is built on.
        <path
          d={`M ${(-g.shoulderHalf).toFixed(2)} ${g.shoulderY.toFixed(2)} L ${g.shoulderHalf.toFixed(2)} ${g.shoulderY.toFixed(2)} L ${(g.shoulderHalf * 0.97).toFixed(2)} ${yokeY.toFixed(2)} L ${(-g.shoulderHalf * 0.97).toFixed(2)} ${yokeY.toFixed(2)} Z`}
          fill={p.panel}
          stroke={p.seam}
          strokeWidth={0.6}
        />
      )}
      {(garment.id === "blazer" || garment.id === "suit") && (
        // Centre back seam and a single vent, which is where a jacket's back reads from.
        <>
          <line x1={0} y1={g.shoulderY} x2={0} y2={g.hemY} stroke={p.seam} strokeWidth={0.6} />
          <line x1={0} y1={g.hemY - 20} x2={0} y2={g.hemY} stroke={p.line} strokeWidth={1.1} />
        </>
      )}
      <line x1={-hemHalf * 0.98} y1={g.hemY - 2.2} x2={hemHalf * 0.98} y2={g.hemY - 2.2} stroke={p.seam} strokeWidth={0.5} />
      <CollarBand g={g} p={p} />
    </g>
  );
}

function CollarBand({ g, p }: { g: TorsoGeometry; p: Palette }) {
  return (
    <path
      d={`M ${(-g.neckHalf - 1.2).toFixed(2)} -0.6 L ${(g.neckHalf + 1.2).toFixed(2)} -0.6 L ${g.neckHalf.toFixed(2)} ${(g.neckDrop + 1).toFixed(2)} C ${(g.neckHalf * 0.6).toFixed(2)} ${(g.neckDrop + 2.6).toFixed(2)} ${(-g.neckHalf * 0.6).toFixed(2)} ${(g.neckDrop + 2.6).toFixed(2)} ${(-g.neckHalf).toFixed(2)} ${(g.neckDrop + 1).toFixed(2)} Z`}
      fill={p.panel}
      stroke={p.line}
      strokeWidth={0.8}
    />
  );
}

// ---------------------------------------------------------------------------------------------
// Detail views
// ---------------------------------------------------------------------------------------------

function collarDetail(d: Dims, p: Palette, isBandOnly: boolean): Scene {
  const half = d.neck / 4;
  const height = d.neck / 4.4;
  const stroke = { stroke: p.line, strokeWidth: 0.6 };

  return {
    viewBox: box(-half - 6, -6, half * 2 + 12, height + 18),
    content: (
      <g>
        {/* The stand — the band that actually goes round the neck, so its width is the neck measure. */}
        <path
          d={`M ${-half} ${height * 0.55} L ${half} ${height * 0.55} L ${half - 1} ${height} L ${-half + 1} ${height} Z`}
          fill={p.panel}
          {...stroke}
        />
        {isBandOnly ? (
          // A kurta closes on a band with a short placket rather than a turned collar.
          <>
            <rect x={-2} y={height} width={4} height={16} fill={p.panel} {...stroke} />
            <circle cx={0} cy={height + 5} r={0.9} fill={p.line} />
            <circle cx={0} cy={height + 12} r={0.9} fill={p.line} />
          </>
        ) : (
          <>
            {/* Two collar leaves falling from the stand. */}
            <path d={`M -0.6 ${height * 0.55} L ${-half - 1} ${height * 0.2} L ${-half + 1.5} ${-height * 0.75} L -0.6 ${-height * 0.2} Z`} fill={p.fill} {...stroke} />
            <path d={`M 0.6 ${height * 0.55} L ${half + 1} ${height * 0.2} L ${half - 1.5} ${-height * 0.75} L 0.6 ${-height * 0.2} Z`} fill={p.fill} {...stroke} />
            <circle cx={0} cy={height * 0.78} r={0.8} fill={p.line} />
          </>
        )}
      </g>
    ),
  };
}

function lapelDetail(d: Dims, p: Palette): Scene {
  const w = d.lapel;
  const height = d.chest / 3.4;
  return {
    viewBox: box(-w * 2.4, -6, w * 4.8, height + 12),
    content: (
      <g>
        <path
          d={`M ${-w * 1.8} 0 L ${w * 0.4} 0 L ${w * 0.4} ${height} L ${-w * 1.8} ${height} Z`}
          fill={p.fill}
          stroke={p.line}
          strokeWidth={0.6}
        />
        {/* The lapel itself, folded back — its width is the figure the tailor was given. */}
        <path
          d={`M ${w * 0.4} 0 L ${-w * 0.5} ${height * 0.16} L ${-w * 0.1} ${height * 0.30} L ${-w * 0.9} ${height * 0.34} L ${w * 0.4} ${height * 0.78} Z`}
          fill={p.panel}
          stroke={p.line}
          strokeWidth={0.7}
        />
        <line x1={-w * 0.5} y1={height * 0.16} x2={-w * 0.1} y2={height * 0.3} stroke={p.line} strokeWidth={0.5} />
        <text x={-w * 1.7} y={height * 0.55} fontSize={2.6} fill={p.seam}>
          {w.toFixed(0)} cm
        </text>
      </g>
    ),
  };
}

function sleeveDetail(d: Dims, p: Palette, isTailored: boolean): Scene {
  const top = flat(d.bicep);
  const end = flat(d.cuff);
  const len = d.sleeve;
  const stroke = { stroke: p.line, strokeWidth: 0.8, strokeLinejoin: "round" as const };

  return {
    viewBox: box(-top / 2 - 8, -10, top + 16, len + 24),
    content: (
      <g>
        {/* The sleeve head is a curve, not a straight edge — it has to fit the armhole. */}
        <path
          d={`M ${-top / 2} 0 C ${-top / 4} ${-9} ${top / 4} ${-9} ${top / 2} 0 L ${end / 2} ${len} L ${-end / 2} ${len} Z`}
          fill={p.fill}
          {...stroke}
        />
        {isTailored ? (
          <>
            {/* Working cuff buttons up the outside seam. */}
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={end / 2 - 2.4} cy={len - 5 - i * 3} r={0.8} fill={p.line} />
            ))}
            <line x1={-end / 2} y1={len - 12} x2={end / 2} y2={len - 12} stroke={p.seam} strokeWidth={0.5} />
          </>
        ) : (
          <>
            {/* Cuff band and the placket that lets a hand through it. */}
            <rect x={-end / 2} y={len - 7} width={end} height={7} fill={p.panel} {...stroke} />
            <rect x={-2} y={len - 19} width={4} height={12} fill={p.panel} stroke={p.seam} strokeWidth={0.5} />
            <circle cx={0} cy={len - 3.5} r={0.9} fill={p.line} />
          </>
        )}
        <text x={0} y={len + 12} fontSize={3} fill={p.seam} textAnchor="middle">
          {len.toFixed(0)} cm long
        </text>
      </g>
    ),
  };
}

function cuffDetail(d: Dims, p: Palette): Scene {
  const w = flat(d.cuff) * 2;
  const h = 9;
  return {
    viewBox: box(-w / 2 - 6, -8, w + 12, h + 22),
    content: (
      <g>
        <rect x={-w / 2} y={0} width={w} height={h} rx={1.2} fill={p.panel} stroke={p.line} strokeWidth={0.8} />
        <line x1={-w / 2 + 1.6} y1={1.6} x2={w / 2 - 1.6} y2={1.6} stroke={p.seam} strokeWidth={0.4} />
        <line x1={-w / 2 + 1.6} y1={h - 1.6} x2={w / 2 - 1.6} y2={h - 1.6} stroke={p.seam} strokeWidth={0.4} />
        <circle cx={w / 2 - 4} cy={h / 2} r={1} fill={p.line} />
        <circle cx={-w / 2 + 4} cy={h / 2} r={1.1} fill="none" stroke={p.line} strokeWidth={0.5} />
        <text x={0} y={h + 10} fontSize={3.4} fill={p.seam} textAnchor="middle">
          {d.cuff.toFixed(0)} cm round
        </text>
      </g>
    ),
  };
}

function slitDetail(d: Dims, p: Palette): Scene {
  const w = q(d.bottom);
  const h = 34;
  return {
    viewBox: box(-w - 6, -6, w * 2 + 12, h + 14),
    content: (
      <g>
        {/* A kurta's side slit: where the two panels part at the hem. */}
        <path d={`M ${-w} 0 L -1.2 0 L -1.2 ${h} L ${-w} ${h} Z`} fill={p.fill} stroke={p.line} strokeWidth={0.8} />
        <path d={`M 1.2 0 L ${w} 0 L ${w} ${h} L 1.2 ${h} Z`} fill={p.fill} stroke={p.line} strokeWidth={0.8} />
        <line x1={-1.2} y1={0} x2={-1.2} y2={h} stroke={p.seam} strokeWidth={0.5} />
        <line x1={1.2} y1={0} x2={1.2} y2={h} stroke={p.seam} strokeWidth={0.5} />
        <line x1={-w} y1={h - 2} x2={-1.2} y2={h - 2} stroke={p.seam} strokeWidth={0.4} />
        <line x1={1.2} y1={h - 2} x2={w} y2={h - 2} stroke={p.seam} strokeWidth={0.4} />
      </g>
    ),
  };
}

// ---------------------------------------------------------------------------------------------
// Lower body
// ---------------------------------------------------------------------------------------------

function trousers(d: Dims, p: Palette, isBack: boolean, figure?: Figure): Scene {
  const waistHalf = q(d.waist);
  const hipHalf = q(d.hip);
  const thighFlat = flat(d.thigh);
  const kneeFlat = flat(d.knee);
  const bottomFlat = flat(d.bottom);

  const bandH = 4;
  const hipY = bandH + d.rise * 0.55;
  const crotchY = bandH + d.rise;
  const hemY = bandH + d.outseam;
  const kneeY = crotchY + (hemY - crotchY) * 0.46;

  // The two legs drift apart slightly below the crotch, which is how a pair reads when laid flat.
  const innerAtCrotch = 0.6;
  const innerAtKnee = 2.4;
  const innerAtHem = 3.4;

  const outline = [
    `M ${-waistHalf} ${bandH}`,
    `C ${-waistHalf} ${hipY * 0.7} ${-hipHalf} ${hipY * 0.8} ${-hipHalf} ${hipY}`,
    `L ${-(thighFlat + innerAtCrotch)} ${crotchY}`,
    `L ${-(kneeFlat + innerAtKnee)} ${kneeY}`,
    `L ${-(bottomFlat + innerAtHem)} ${hemY}`,
    `L ${-innerAtHem} ${hemY}`,
    `L ${-innerAtKnee} ${kneeY}`,
    `L ${-innerAtCrotch} ${crotchY}`,
    `L 0 ${crotchY - 2}`,
    `L ${innerAtCrotch} ${crotchY}`,
    `L ${innerAtKnee} ${kneeY}`,
    `L ${innerAtHem} ${hemY}`,
    `L ${bottomFlat + innerAtHem} ${hemY}`,
    `L ${kneeFlat + innerAtKnee} ${kneeY}`,
    `L ${thighFlat + innerAtCrotch} ${crotchY}`,
    `L ${hipHalf} ${hipY}`,
    `C ${hipHalf} ${hipY * 0.8} ${waistHalf} ${hipY * 0.7} ${waistHalf} ${bandH}`,
    "Z",
  ].join(" ");

  const width = Math.max(waistHalf, hipHalf, thighFlat + innerAtCrotch, bottomFlat + innerAtHem) * 2 + 14;

  // The upper body sits above the waistband rather than below the shoulder, so the figure has to be
  // shifted down into the trousers' own coordinates — its origin is the neck, and here y=0 is the
  // top of the waistband.
  const parts = figure ? figureParts(figure) : null;
  const torsoDrop = figure ? figure.heightCm * 0.26 : 0;
  const topY = parts ? -torsoDrop - parts.neckLength - parts.headHeight - 6 : -6;

  return {
    viewBox: box(-width / 2, topY, width, hemY - topY + 14),
    content: (
      <g>
        {figure && (
          // Bare above the waist: these are trousers, and drawing a shirt he did not order would
          // put a garment on screen nobody chose.
          <g transform={`translate(0 ${(-torsoDrop).toFixed(2)})`}>
            <Body
              figure={figure}
              shoulderHalf={hipHalf * 1.12}
              hipHalf={hipHalf}
              crotchY={torsoDrop + crotchY}
              sleeveEnd={null}
              skinLine={p.line}
            />
          </g>
        )}
        <path d={outline} fill={p.fill} stroke={p.line} strokeWidth={0.9} strokeLinejoin="round" />
        {/* Waistband, drawn to the waist measure because that is the figure it is cut to. */}
        <rect x={-waistHalf} y={0} width={waistHalf * 2} height={bandH} fill={p.panel} stroke={p.line} strokeWidth={0.8} />
        <line x1={-waistHalf + 2} y1={1.3} x2={waistHalf - 2} y2={1.3} stroke={p.seam} strokeWidth={0.4} />

        {isBack ? (
          <>
            {/* Back pockets and the seat seam. */}
            <rect x={-hipHalf * 0.62 - 6} y={hipY - 2} width={12} height={2} fill={p.panel} stroke={p.seam} strokeWidth={0.5} />
            <rect x={hipHalf * 0.62 - 6} y={hipY - 2} width={12} height={2} fill={p.panel} stroke={p.seam} strokeWidth={0.5} />
            <path d={`M 0 ${bandH} L 0 ${crotchY - 2}`} stroke={p.seam} strokeWidth={0.7} fill="none" />
          </>
        ) : (
          <>
            {/* Fly, and the slanted side pockets a trouser front carries. */}
            <path d={`M 1.4 ${bandH} L 1.4 ${crotchY - 6} C 1.4 ${crotchY - 3} 0.6 ${crotchY - 2.5} 0 ${crotchY - 2}`} fill="none" stroke={p.seam} strokeWidth={0.7} />
            <line x1={-hipHalf + 1} y1={bandH + 2} x2={-hipHalf * 0.45} y2={hipY + 2} stroke={p.seam} strokeWidth={0.7} />
            <line x1={hipHalf - 1} y1={bandH + 2} x2={hipHalf * 0.45} y2={hipY + 2} stroke={p.seam} strokeWidth={0.7} />
            {/* Crease lines down each leg. */}
            <line x1={-(thighFlat / 2 + innerAtCrotch)} y1={crotchY} x2={-(bottomFlat / 2 + innerAtHem)} y2={hemY} stroke={p.seam} strokeWidth={0.4} />
            <line x1={thighFlat / 2 + innerAtCrotch} y1={crotchY} x2={bottomFlat / 2 + innerAtHem} y2={hemY} stroke={p.seam} strokeWidth={0.4} />
          </>
        )}

        <line x1={-(bottomFlat + innerAtHem)} y1={hemY - 3} x2={-innerAtHem} y2={hemY - 3} stroke={p.seam} strokeWidth={0.5} />
        <line x1={innerAtHem} y1={hemY - 3} x2={bottomFlat + innerAtHem} y2={hemY - 3} stroke={p.seam} strokeWidth={0.5} />
      </g>
    ),
  };
}

function waistbandDetail(d: Dims, p: Palette): Scene {
  const w = flat(d.waist);
  const h = 7;
  return {
    viewBox: box(-w / 2 - 6, -10, w + 12, h + 26),
    content: (
      <g>
        <rect x={-w / 2} y={0} width={w} height={h} rx={1} fill={p.panel} stroke={p.line} strokeWidth={0.8} />
        <line x1={-w / 2 + 2} y1={1.5} x2={w / 2 - 2} y2={1.5} stroke={p.seam} strokeWidth={0.4} />
        <line x1={-w / 2 + 2} y1={h - 1.5} x2={w / 2 - 2} y2={h - 1.5} stroke={p.seam} strokeWidth={0.4} />
        {/* Belt loops, spaced across whatever width the waist works out to. */}
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={-w / 2 + 3 + (i * (w - 6)) / 6 - 0.7} y={-1.5} width={1.4} height={h + 3} fill={p.fill} stroke={p.seam} strokeWidth={0.35} />
        ))}
        <circle cx={-w / 2 + 5} cy={h / 2} r={1} fill={p.line} />
        <text x={0} y={h + 12} fontSize={3.6} fill={p.seam} textAnchor="middle">
          {d.waist.toFixed(0)} cm round
        </text>
      </g>
    ),
  };
}

function pocketDetail(d: Dims, p: Palette): Scene {
  const w = Math.max(13, d.hip / 7);
  const h = w * 1.15;
  return {
    viewBox: box(-w - 6, -8, w * 2 + 12, h + 20),
    content: (
      <g>
        <rect x={-w} y={-4} width={w * 2} height={h + 12} fill={p.fill} stroke={p.line} strokeWidth={0.7} />
        {/* The pocket bag, set into the panel behind it. */}
        <path d={`M ${-w * 0.55} 2 L ${w * 0.55} 2 L ${w * 0.55} ${h * 0.72} L 0 ${h * 0.92} L ${-w * 0.55} ${h * 0.72} Z`} fill={p.panel} stroke={p.line} strokeWidth={0.7} />
        <line x1={-w * 0.55} y1={4} x2={w * 0.55} y2={4} stroke={p.seam} strokeWidth={0.5} />
        <text x={0} y={h + 13} fontSize={3.2} fill={p.seam} textAnchor="middle">
          {w.toFixed(0)} cm wide
        </text>
      </g>
    ),
  };
}

function hemDetail(d: Dims, p: Palette): Scene {
  const w = flat(d.bottom);
  const h = 26;
  return {
    viewBox: box(-w / 2 - 8, -8, w + 16, h + 22),
    content: (
      <g>
        <path d={`M ${-w / 2 - 1.5} 0 L ${w / 2 + 1.5} 0 L ${w / 2} ${h} L ${-w / 2} ${h} Z`} fill={p.fill} stroke={p.line} strokeWidth={0.8} />
        {/* The turn-up at the bottom of the leg. */}
        <rect x={-w / 2} y={h - 5} width={w} height={5} fill={p.panel} stroke={p.line} strokeWidth={0.6} />
        <line x1={-w / 2 + 0.5} y1={h - 7.5} x2={w / 2 - 0.5} y2={h - 7.5} stroke={p.seam} strokeWidth={0.4} />
        <text x={0} y={h + 11} fontSize={3.6} fill={p.seam} textAnchor="middle">
          {d.bottom.toFixed(0)} cm opening
        </text>
      </g>
    ),
  };
}
