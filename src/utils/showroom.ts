// Showroom mode: the designs shown to a customer, one after another. Which comes
// when is worked out here, apart from the screen, so it can be tested.

/** The most of a design's photos that fade through on its slide. */
export const SHOWROOM_PHOTOS_SHOWN = 3;

const SLIDE_MS = 5000;
const MS_PER_PHOTO = 2500;

/**
 * When, on a slide, each fade to the next photo starts: so that every photo has its
 * equal share of the slide, the fade ending as the next one's share begins.
 */
export const photoFadeStarts = (
  slideMs: number,
  photos: number,
  fadeMs: number
): number[] =>
  Array.from(
    { length: Math.max(photos - 1, 0) },
    (_, turn) => (slideMs / photos) * (turn + 1) - fadeMs
  );

/** How long a design stays: longer with more photos, so each is seen. */
export const showroomSlideMs = (photoCount: number): number =>
  Math.max(
    SLIDE_MS,
    Math.min(photoCount, SHOWROOM_PHOTOS_SHOWN) * MS_PER_PHOTO
  );

/** How large to set a design's name: a long one smaller, to stay within its lines. */
export function designNameSize(name: string, wide: boolean): number {
  const length = name.trim().length;
  if (wide) return length <= 22 ? 44 : length <= 40 ? 34 : 28;
  return length <= 22 ? 32 : length <= 40 ? 26 : 22;
}

const PIN = /^\d{4}$/;

export const PIN_LENGTH = 4;

export const isFullPin = (pin: string): boolean => PIN.test(pin);

export interface ShowroomCategory {
  id: number;
  name: string;
  count: number;
}

/** The categories among `designs`, in the order they first come, with counts. */
export function showroomCategories(
  designs: readonly { categoryId: number; categoryName: string }[]
): ShowroomCategory[] {
  const categories = new Map<number, ShowroomCategory>();
  designs.forEach(({ categoryId, categoryName }) => {
    const known = categories.get(categoryId);
    if (known) known.count += 1;
    else {
      categories.set(categoryId, {
        id: categoryId,
        name: categoryName,
        count: 1,
      });
    }
  });
  return [...categories.values()];
}

/**
 * The order of the slides: the chosen categories taking turns, one design each, so
 * a customer sees the range rather than ten of one kind in a row. A category that
 * runs out drops out of the turns. Each category keeps the order it is given in.
 */
export function showroomSlides<T extends { categoryId: number }>(
  designs: readonly T[],
  categoryIds: readonly number[]
): T[] {
  const chosen = new Set(categoryIds);
  const queues = new Map<number, T[]>();
  designs
    .filter((design) => chosen.has(design.categoryId))
    .forEach((design) => {
      queues.set(design.categoryId, [
        ...(queues.get(design.categoryId) ?? []),
        design,
      ]);
    });
  const longest = Math.max(0, ...[...queues.values()].map((q) => q.length));
  const slides: T[] = [];
  for (let turn = 0; turn < longest; turn += 1) {
    queues.forEach((queue) => {
      if (turn < queue.length) slides.push(queue[turn]);
    });
  }
  return slides;
}
