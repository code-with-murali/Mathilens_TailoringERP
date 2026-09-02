import type { MeasurementValue } from "@/lib/api/measurements";

/**
 * What the simulator needs to draw a garment, in centimetres — the unit the rest of the system
 * records measurements in (see Measurement.cs).
 *
 * Circumferences stay circumferences here and are halved at the point of drawing, because that is
 * the one conversion a tailor already knows: a garment laid flat is half its round measure across.
 * Storing pre-halved numbers would make every figure on this screen disagree with the tape.
 */
export type Dims = {
  neck: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  sleeve: number;
  bicep: number;
  cuff: number;
  armhole: number;
  backWidth: number;
  length: number;
  lapel: number;
  bottom: number;
  thigh: number;
  knee: number;
  calf: number;
  inseam: number;
  outseam: number;
  rise: number;
};

export type DimKey = keyof Dims;

/** One editable figure on the panel beside the drawing. */
export type DimField = {
  key: DimKey;
  label: string;
  /** The sane range for an adult garment, so a slider cannot draw something impossible. */
  min: number;
  max: number;
};

export type SimulatorView = {
  id: string;
  /** What the tab says. Named per garment: trousers have no collar and a shirt has no waistband. */
  label: string;
};

export type GarmentSpec = {
  id: string;
  label: string;
  /**
   * The names this garment's measurements may be stored under, so a customer measured for "Pant"
   * is found when the simulator is showing Trousers. Matched case-insensitively.
   */
  aliases: string[];
  views: SimulatorView[];
  fields: DimField[];
  defaults: Dims;
};

/**
 * A middling adult fit, used for every figure a garment does not itself override.
 *
 * The screen has to draw something the moment it opens — before a customer is chosen, and for the
 * points a shop's own template happens not to include. Starting from a real set of proportions
 * means the first thing a tailor sees is a garment, not a collapsed outline.
 */
const BASE: Dims = {
  neck: 40,
  shoulder: 46,
  chest: 100,
  waist: 92,
  hip: 100,
  sleeve: 60,
  bicep: 34,
  cuff: 22,
  armhole: 48,
  backWidth: 42,
  length: 76,
  lapel: 8,
  bottom: 36,
  thigh: 58,
  knee: 42,
  calf: 38,
  inseam: 78,
  outseam: 104,
  rise: 26,
};

const F = (key: DimKey, label: string, min: number, max: number): DimField => ({ key, label, min, max });

// The figures every upper-body garment is cut from. Listed once because a shirt, a kurta and a
// blazer are the same five decisions above the waist and differ below it.
const TORSO_FIELDS: DimField[] = [
  F("shoulder", "Shoulder width", 34, 60),
  F("chest", "Chest", 70, 140),
  F("waist", "Waist", 60, 140),
  F("hip", "Hip", 70, 145),
  F("length", "Length", 55, 130),
  F("sleeve", "Sleeve length", 15, 75),
  F("bicep", "Bicep", 22, 55),
  F("neck", "Neck", 30, 55),
];

const TROUSER_FIELDS: DimField[] = [
  F("waist", "Waist", 60, 140),
  F("hip", "Hip/Seat", 70, 150),
  F("thigh", "Thigh", 40, 85),
  F("knee", "Knee", 30, 65),
  F("calf", "Calf", 26, 60),
  F("rise", "Rise", 18, 36),
  F("inseam", "Inseam", 55, 95),
  F("outseam", "Outseam", 80, 120),
  F("bottom", "Bottom opening", 26, 60),
];

/**
 * The five garments this screen draws, each with the five views a tailor would actually turn a
 * customer through: the whole thing front and back, then the three places a fit conversation
 * always ends up — how it closes at the neck, how it runs down the arm, and how it finishes.
 */
export const GARMENTS: GarmentSpec[] = [
  {
    id: "shirt",
    label: "Shirt",
    aliases: ["Shirt"],
    views: [
      { id: "front", label: "Full view" },
      { id: "back", label: "Back view" },
      { id: "collar", label: "Collar" },
      { id: "sleeve", label: "Hand" },
      { id: "cuff", label: "Cuff" },
    ],
    fields: [...TORSO_FIELDS, F("cuff", "Wrist", 15, 32)],
    defaults: { ...BASE },
  },
  {
    id: "trousers",
    label: "Trousers",
    // "Pant" is what most shops here type; the standard points are shared under both names in
    // MeasurementTemplateDefaults, and this matches that.
    aliases: ["Trousers", "Trouser", "Pant", "Pants"],
    views: [
      { id: "front", label: "Full view" },
      { id: "back", label: "Back view" },
      { id: "waistband", label: "Waistband" },
      { id: "pocket", label: "Pocket" },
      { id: "hem", label: "Bottom" },
    ],
    fields: TROUSER_FIELDS,
    defaults: { ...BASE, waist: 84 },
  },
  {
    id: "kurta",
    label: "Kurta",
    aliases: ["Kurta"],
    views: [
      { id: "front", label: "Full view" },
      { id: "back", label: "Back view" },
      { id: "collar", label: "Neckline" },
      { id: "sleeve", label: "Hand" },
      { id: "hem", label: "Side slit" },
    ],
    fields: [...TORSO_FIELDS, F("bottom", "Bottom opening", 90, 150)],
    // Longer and cut straighter than a shirt: a kurta falls past the hip rather than tucking in.
    defaults: { ...BASE, chest: 104, waist: 102, hip: 106, length: 105, sleeve: 58, bottom: 118 },
  },
  {
    id: "blazer",
    label: "Blazer",
    aliases: ["Blazer", "Coat"],
    views: [
      { id: "front", label: "Full view" },
      { id: "back", label: "Back view" },
      { id: "collar", label: "Lapel" },
      { id: "sleeve", label: "Hand" },
      { id: "pocket", label: "Pocket" },
    ],
    fields: [...TORSO_FIELDS, F("cuff", "Cuff", 18, 38), F("lapel", "Lapel width", 5, 13)],
    defaults: { ...BASE, chest: 104, waist: 96, hip: 102, sleeve: 63, bicep: 36, cuff: 28, length: 74 },
  },
  {
    id: "suit",
    label: "Suit",
    aliases: ["Suit"],
    views: [
      { id: "front", label: "Full view" },
      { id: "back", label: "Back view" },
      { id: "collar", label: "Lapel" },
      { id: "sleeve", label: "Hand" },
      { id: "trousers", label: "Trousers" },
    ],
    fields: [...TORSO_FIELDS, F("cuff", "Cuff", 18, 38), F("lapel", "Lapel width", 5, 13), ...TROUSER_FIELDS.slice(0, 4)],
    defaults: { ...BASE, chest: 104, waist: 96, hip: 102, sleeve: 63, bicep: 36, cuff: 28, length: 74 },
  },
];

export function garmentById(id: string): GarmentSpec {
  return GARMENTS.find((g) => g.id === id) ?? GARMENTS[0];
}

/**
 * Which measurement point names feed each drawn figure.
 *
 * Matched as substrings against whatever the shop's template actually calls them, because these
 * names are shop-editable: "Shirt length", "Jacket length" and "Kurta length" are all the length,
 * and a screen that only understood one of them would silently ignore two garments' worth of
 * measurements. Listed most specific first — "Trouser waist" must not be read as the jacket waist.
 */
const POINT_MATCHES: Record<DimKey, string[]> = {
  neck: ["neck"],
  shoulder: ["shoulder width", "shoulder"],
  chest: ["chest", "bust"],
  waist: ["waist"],
  hip: ["hip", "seat"],
  sleeve: ["sleeve length", "sleeve"],
  bicep: ["bicep", "arm round"],
  cuff: ["cuff", "wrist"],
  armhole: ["armhole"],
  backWidth: ["back width"],
  length: ["shirt length", "jacket length", "kurta length", "blazer length", "blouse length", "full length", "length"],
  lapel: ["lapel"],
  bottom: ["bottom opening", "bottom"],
  thigh: ["thigh"],
  knee: ["knee"],
  calf: ["calf"],
  inseam: ["inseam"],
  outseam: ["outseam"],
  rise: ["rise"],
};

/** Points that must never be matched loosely, because a longer name means a different garment part. */
const EXCLUDE: Partial<Record<DimKey, string[]>> = {
  waist: ["trouser waist", "shoulder to waist", "waist to hem", "under-bust"],
  length: ["sleeve length"],
};

/**
 * Reads a saved measurement set into the figures the drawing needs.
 *
 * Anything the set does not carry keeps the garment's default rather than dropping to zero — a
 * shop whose template omits Bicep should still see a sleeve, drawn to a normal arm, not a garment
 * with a flat edge where the sleeve was. Non-numeric points (the Checkbox and Text ones a template
 * may hold, like "Side pocket" or "V.H Style") are skipped: they say how it is made, not how big.
 */
export function dimsFromMeasurement(spec: GarmentSpec, values: Record<string, MeasurementValue>): Dims {
  const numeric = Object.entries(values).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0,
  );

  const resolved = { ...spec.defaults };

  for (const key of Object.keys(POINT_MATCHES) as DimKey[]) {
    const excluded = EXCLUDE[key] ?? [];
    for (const candidate of POINT_MATCHES[key]) {
      const hit = numeric.find(([name]) => {
        const lower = name.toLowerCase();
        return lower.includes(candidate) && !excluded.some((bad) => lower.includes(bad));
      });
      if (hit) {
        resolved[key] = hit[1];
        break;
      }
    }
  }

  return resolved;
}

/**
 * One of the men the garment can be shown on.
 *
 * <p>Drawn rather than photographed, and parametric rather than a file per pose: ten men across
 * five garments and five views would be 250 photographs to source, license and store, where ten
 * sets of proportions cover the same ground and cost nothing. The trade is honest — this is
 * unmistakably an illustration — but it keeps the property a stock photograph would have thrown
 * away, which is that the garment on him is still cut to this customer's measurements.</p>
 */
export type Figure = {
  id: string;
  label: string;
  /** Sets the head, arms and legs. The garment's own size comes from the measurements, never from here. */
  heightCm: number;
  /** How heavily built he is, used only where the drawing has no measurement to go on. */
  weight: "lean" | "average" | "heavy";
  /** Drawn skin, so the ten men do not all look like the same man. */
  skin: string;
};

/**
 * Ten men, spread across the range a shop actually measures rather than ten variations on one
 * build. A tailor picks whoever stands closest to the customer in front of them.
 */
export const FIGURES: Figure[] = [
  { id: "m1", label: "Arun", heightCm: 165, weight: "lean", skin: "#8d5524" },
  { id: "m2", label: "Bala", heightCm: 170, weight: "average", skin: "#c68642" },
  { id: "m3", label: "Chandran", heightCm: 175, weight: "average", skin: "#6b4423" },
  { id: "m4", label: "Dinesh", heightCm: 180, weight: "lean", skin: "#e0ac69" },
  { id: "m5", label: "Ezhil", heightCm: 172, weight: "heavy", skin: "#a0522d" },
  { id: "m6", label: "Ganesh", heightCm: 168, weight: "heavy", skin: "#7d4a2e" },
  { id: "m7", label: "Hari", heightCm: 178, weight: "average", skin: "#f1c27d" },
  { id: "m8", label: "Iyappan", heightCm: 162, weight: "average", skin: "#5c3a21" },
  { id: "m9", label: "Jagan", heightCm: 185, weight: "lean", skin: "#c68642" },
  { id: "m10", label: "Kumar", heightCm: 174, weight: "heavy", skin: "#8d5524" },
];

export function figureById(id: string): Figure {
  return FIGURES.find((f) => f.id === id) ?? FIGURES[1];
}

/** The fabric colours a shop reaches for most, so the common case is one tap rather than a hex code. */
export const SWATCHES: { name: string; hex: string }[] = [
  { name: "White", hex: "#f5f5f0" },
  { name: "Cream", hex: "#e8dcc0" },
  { name: "Sky", hex: "#8fb8d8" },
  { name: "Blue", hex: "#3f6fa8" },
  { name: "Navy", hex: "#1f2d4a" },
  { name: "Black", hex: "#22242a" },
  { name: "Grey", hex: "#8a8f98" },
  { name: "Charcoal", hex: "#4a4e57" },
  { name: "Beige", hex: "#c8b393" },
  { name: "Brown", hex: "#6b4a33" },
  { name: "Olive", hex: "#5f6b45" },
  { name: "Maroon", hex: "#6d2f3a" },
];

/**
 * Mixes a colour towards black or white.
 *
 * Seams, plackets and the inside of a collar have to read against the fabric whatever the fabric
 * is, and one fixed grey cannot do that: it disappears on charcoal and shouts on cream. Deriving
 * every line from the chosen colour keeps a white shirt looking like a drawing of a white shirt.
 */
export function shade(hex: string, amount: number): string {
  const normalised = hex.replace("#", "");
  const full =
    normalised.length === 3
      ? normalised
          .split("")
          .map((c) => c + c)
          .join("")
      : normalised;

  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value) || full.length !== 6) {
    return hex;
  }

  const target = amount < 0 ? 255 : 0;
  const weight = Math.abs(amount);
  const channel = (shift: number) => {
    const c = (value >> shift) & 0xff;
    return Math.round(c + (target - c) * weight);
  };

  return `#${[channel(16), channel(8), channel(0)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** True for a fabric pale enough that a near-white outline would vanish against it. */
export function isPale(hex: string): boolean {
  const normalised = hex.replace("#", "");
  const full = normalised.length === 3 ? normalised.split("").map((c) => c + c).join("") : normalised;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value) || full.length !== 6) {
    return true;
  }
  // Rec. 601 luma: green carries most of the perceived brightness, so a flat average would call
  // a saturated blue "light" and outline it wrongly.
  const luma = 0.299 * ((value >> 16) & 0xff) + 0.587 * ((value >> 8) & 0xff) + 0.114 * (value & 0xff);
  return luma > 140;
}
