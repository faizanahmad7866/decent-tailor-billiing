import type { PatternItem } from '../repositories/patternRepo';
import type { ClothEntry, GarmentEntry } from './billForm';
import { metersToInput } from './billMath';
import { paiseToInput, paiseToSignedInput } from './money';

// A bill made from a design: the cloths it needs, each with its type, extra
// and meters, and one garment line named for the design whose making charge is
// the design's stitching — so the bill, and the receipt printed from it, read
// as the design does: its cloth, its stitching, what it comes to.

export interface DesignBillLines {
  cloths: ClothEntry[];
  garments: GarmentEntry[];
}

/** The lines of a New Bill form for `item`; `nextKey` hands out each line's key. */
export function billLinesFromDesign(
  item: PatternItem,
  nextKey: () => string
): DesignBillLines {
  return {
    cloths: item.cloths.map((cloth) => ({
      key: nextKey(),
      clothId: cloth.clothId,
      clothName: cloth.clothName,
      clothNameHindi: cloth.nameHindi,
      imageName: cloth.imageName,
      // The catalog rate, before the extra, as a bill line keeps it.
      pricePerMeterPaise: cloth.pricePerMeterPaise - cloth.extraPerMeterPaise,
      variant: cloth.variant ?? '',
      extra: cloth.extraPerMeterPaise
        ? paiseToSignedInput(cloth.extraPerMeterPaise)
        : '',
      meters: metersToInput(cloth.lengthCm),
    })),
    garments: [
      {
        key: nextKey(),
        name: item.name,
        custom: true,
        quantity: 1,
        making: paiseToInput(item.stitchingPaise),
      },
    ],
  };
}
