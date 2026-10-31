import type { ClothType } from '../repositories/clothTypeRepo';
import type { PatternCloth, PatternItem } from '../repositories/patternRepo';
import { clothLineAmount } from './billMath';
import { shownPrice } from './patternPricing';

// A design's price as a customer works it out in the showroom: its cloths, each
// in the fabric they choose among the cloth's types, plus the stitching. The
// rate of a type is worked out the way the catalogue works out the design's own —
// the type's rate per meter plus the design's extra on that cloth — so the price
// shown for the fabric the tailor chose is the design's price to the paisa.

export interface FabricOption {
  /** Which fabric, within its cloth: the type's name, lower-cased. */
  key: string;
  /** The type's name; empty for the cloth itself, with no type. */
  name: string;
  /** Per meter, with the design's extra. */
  ratePaise: number;
  imageName: string | null;
  /** The fabric the tailor chose for the design. */
  own: boolean;
}

export interface FabricLine {
  cloth: PatternCloth;
  /** Cheapest first; one of them is the design's own. */
  options: FabricOption[];
}

const keyOf = (name: string | null): string =>
  (name ?? '').trim().toLowerCase();

/** What a design's cloth can be had in: its own fabric and the cloth's other types. */
export function fabricOptions(
  cloth: PatternCloth,
  types: readonly ClothType[]
): FabricOption[] {
  const own: FabricOption = {
    key: keyOf(cloth.variant),
    name: cloth.variant?.trim() ?? '',
    ratePaise: cloth.pricePerMeterPaise,
    imageName: cloth.imageName,
    own: true,
  };
  const others = types
    .filter((type) => keyOf(type.name) && keyOf(type.name) !== own.key)
    .map((type) => ({
      key: keyOf(type.name),
      name: type.name.trim(),
      ratePaise: type.pricePerMeterPaise + cloth.extraPerMeterPaise,
      // The line's photo is its own type's; another type without one has none.
      imageName: type.imageName,
      own: false,
    }))
    // A reduction may not take a rate to nothing, as on a bill.
    .filter((option) => option.ratePaise > 0);
  return [own, ...others].sort((a, b) => a.ratePaise - b.ratePaise);
}

export interface PricedLine {
  cloth: PatternCloth;
  option: FabricOption;
  amountPaise: number;
}

export interface ShowroomPrice {
  lines: PricedLine[];
  clothPaise: number;
  stitchingPaise: number;
  /** 0 for a design with no price yet: "Ask for price", never ₹0. */
  totalPaise: number;
  /** A fabric other than the tailor's own is chosen on some line. */
  changed: boolean;
}

/**
 * The design priced with the fabric chosen on each line, by key; a line with
 * none chosen, or a key it does not have, keeps the design's own.
 */
export function priceWithFabrics(
  item: Pick<PatternItem, 'stitchingPaise' | 'pricePaise'>,
  lines: readonly FabricLine[],
  chosen: readonly (string | undefined)[]
): ShowroomPrice {
  const priced = lines.map(({ cloth, options }, at) => {
    const option =
      options.find((each) => each.key === chosen[at]) ??
      options.find((each) => each.own) ??
      options[0];
    return {
      cloth,
      option,
      amountPaise: clothLineAmount({
        pricePerMeterPaise: option.ratePaise,
        lengthCm: cloth.lengthCm,
      }),
    };
  });
  const clothPaise = priced.reduce((sum, line) => sum + line.amountPaise, 0);
  return {
    lines: priced,
    clothPaise,
    stitchingPaise: item.stitchingPaise,
    // A design given its price by hand, before prices were worked out, keeps it.
    totalPaise: shownPrice(
      priced.map((line) => ({
        pricePerMeterPaise: line.option.ratePaise,
        lengthCm: line.cloth.lengthCm,
      })),
      item.stitchingPaise,
      item.pricePaise
    ),
    changed: priced.some((line) => !line.option.own),
  };
}

/** "Armani Suiting — Royal", or the cloth alone where it has no type. */
export const fabricLabel = (line: PricedLine): string =>
  line.option.name
    ? `${line.cloth.clothName} — ${line.option.name}`
    : line.cloth.clothName;
