import { later } from '../i18n/t';
import { clothLineAmount } from './billMath';
import { formatRupees } from './money';

// A design's price is made, not set: the cloths it needs — each cloth's rate
// times the meters of it — plus the stitching charge.

export interface PricedCloth {
  pricePerMeterPaise: number;
  lengthCm: number;
}

export interface PatternPrice {
  clothPaise: number;
  stitchingPaise: number;
  totalPaise: number;
}

/** What a design comes to: its cloth, its stitching, and the two together. */
export function patternPrice(
  cloths: readonly PricedCloth[],
  stitchingPaise: number
): PatternPrice {
  const clothPaise = cloths.reduce(
    (sum, line) => sum + clothLineAmount(line),
    0
  );
  return {
    clothPaise,
    stitchingPaise,
    totalPaise: clothPaise + stitchingPaise,
  };
}

/**
 * The price to show: worked out from the cloths and stitching, or — for a
 * design made before prices were worked out, which has neither — the price it
 * was given.
 */
export function shownPrice(
  cloths: readonly PricedCloth[],
  stitchingPaise: number,
  givenPaise: number
): number {
  if (!cloths.length && stitchingPaise === 0) return givenPaise;
  return patternPrice(cloths, stitchingPaise).totalPaise;
}

/** A design as it stood before a change, for what its price falls back on. */
interface PricedBefore {
  cloths: readonly unknown[];
  stitchingPaise: number;
  pricePaise: number;
}

/**
 * The price to save with a design. With cloths or stitching it is worked out.
 * With neither it is none — unless the design never had them either, which
 * makes it one given a price by hand, before prices were worked out: changing
 * its note or its photos must not wipe that.
 */
export function priceToSave(
  cloths: readonly PricedCloth[],
  stitchingPaise: number,
  before: PricedBefore | null
): number {
  if (cloths.length || stitchingPaise > 0) {
    return patternPrice(cloths, stitchingPaise).totalPaise;
  }
  return before && !before.cloths.length && before.stitchingPaise === 0
    ? before.pricePaise
    : 0;
}

/**
 * A design's price as a customer reads it. A design with no cloth and no
 * stitching on it has no price yet, and "₹0" would read as free.
 */
export function designPriceText(paise: number): string {
  return paise > 0 ? formatRupees(paise) : later('Ask for price');
}
