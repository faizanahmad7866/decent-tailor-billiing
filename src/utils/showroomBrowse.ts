// The customer's side of the showroom, when they explore it themselves: the
// designs in the order they ask for, how many to a row, and the designs they
// keep for the tailor ("My picks"). Apart from the screens, so it can be tested.

export type DesignSort = 'newest' | 'priceLow' | 'priceHigh';

export const DESIGN_SORTS: readonly DesignSort[] = [
  'newest',
  'priceLow',
  'priceHigh',
];

/**
 * The designs in the order asked for. Newest is the catalogue's own order. By
 * price, a design with no price yet goes last either way, since it has no
 * place among the figures; equal prices keep the catalogue's order.
 */
export function sortDesigns<T extends { pricePaise: number }>(
  designs: readonly T[],
  sort: DesignSort
): T[] {
  if (sort === 'newest') return [...designs];
  const priced = designs.filter((design) => design.pricePaise > 0);
  const unpriced = designs.filter((design) => design.pricePaise <= 0);
  const direction = sort === 'priceLow' ? 1 : -1;
  return [
    ...priced
      .map((design, at) => ({ design, at }))
      .sort(
        (a, b) =>
          (a.design.pricePaise - b.design.pricePaise) * direction || a.at - b.at
      )
      .map(({ design }) => design),
    ...unpriced,
  ];
}

/** Designs to a row: two on a phone, three on a small tablet, four on a large. */
export function gridColumns(width: number): number {
  if (width >= 1100) return 4;
  if (width >= 700) return 3;
  return 2;
}

/** A design the customer keeps, priced in the fabric they chose for it. */
export interface DesignPick {
  designId: number;
  pricePaise: number;
  /** The fabrics chosen where they are not the tailor's own: "Armani — Royal". */
  fabrics: string[];
}

export const isPicked = (
  picks: readonly DesignPick[],
  designId: number
): boolean => picks.some((pick) => pick.designId === designId);

/** Kept, or taken out again if it already was. */
export function togglePick(
  picks: readonly DesignPick[],
  pick: DesignPick
): DesignPick[] {
  return isPicked(picks, pick.designId)
    ? picks.filter((each) => each.designId !== pick.designId)
    : [...picks, pick];
}

/** A kept design brought up to date, after its fabric changes, in its place. */
export function updatePick(
  picks: readonly DesignPick[],
  pick: DesignPick
): DesignPick[] {
  return picks.map((each) => (each.designId === pick.designId ? pick : each));
}

/** What the picks come to, and how many have no price to add. */
export function picksTotal(picks: readonly DesignPick[]): {
  totalPaise: number;
  unpriced: number;
} {
  return picks.reduce(
    (sum, pick) =>
      pick.pricePaise > 0
        ? { ...sum, totalPaise: sum.totalPaise + pick.pricePaise }
        : { ...sum, unpriced: sum.unpriced + 1 },
    { totalPaise: 0, unpriced: 0 }
  );
}

/**
 * Other designs to look at next, from the same category: those after it first,
 * then from the start, so going through them walks the whole category.
 */
export function moreLikeThis<T extends { id: number; categoryId: number }>(
  designs: readonly T[],
  current: T,
  count: number
): T[] {
  const same = designs.filter((d) => d.categoryId === current.categoryId);
  const at = same.findIndex((d) => d.id === current.id);
  const after = [...same.slice(at + 1), ...same.slice(0, Math.max(at, 0))];
  return after.filter((d) => d.id !== current.id).slice(0, count);
}
