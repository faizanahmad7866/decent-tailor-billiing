import { addDays, startOfDay } from './dateRange';

// Offers shown in the showroom, between the designs. An offer is only something to
// read: it does not change what a bill comes to.

/** At most this many: more would crowd out the designs they sit among. */
export const MAX_OFFERS = 3;

/** One offer after this many designs. */
export const DESIGNS_PER_OFFER = 4;

/** Longer than a design: there is more to read, and it builds up as it appears. */
export const OFFER_SLIDE_MS = 8000;

export const OFFER_TITLE_MAX_LENGTH = 24;
export const OFFER_LINE_MAX_LENGTH = 50;

export const OFFER_ICONS = [
  'sparkles',
  'gift',
  'pricetag',
  'flame',
  'star',
  'diamond',
] as const;

export type OfferIcon = (typeof OFFER_ICONS)[number];

export interface Offer {
  id: number;
  /** The occasion, above the offer: "Eid offer". Optional. */
  occasion: string;
  /** The offer itself, set large: "10% off". */
  title: string;
  /** A line under it: "On all Jodhpuri suits". Optional. */
  note: string;
  icon: OfferIcon;
  /** The last day it runs, as the start of that day on the phone's clock. */
  endsAt: string;
  on: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days to its last day: 0 on the day itself, below 0 once it has ended. */
export function daysLeft(endsAt: string, now: Date = new Date()): number {
  const end = startOfDay(new Date(endsAt)).getTime();
  // Rounded, so a clock change cannot make a day 0.96 long.
  return Math.round((end - startOfDay(now).getTime()) / MS_PER_DAY);
}

/** The offers to show today: switched on, and not yet past their last day. */
export const liveOffers = (
  offers: readonly Offer[],
  now: Date = new Date()
): Offer[] =>
  offers.filter((offer) => offer.on && daysLeft(offer.endsAt, now) >= 0);

/** The last day of an offer running `days` days from `now`, today being the first. */
export const offerEndAfter = (days: number, now: Date = new Date()): string =>
  addDays(startOfDay(now), days - 1).toISOString();

export type ShowroomSlide<T> =
  | { kind: 'design'; key: string; design: T }
  | { kind: 'offer'; key: string; offer: Offer };

/**
 * The designs with an offer after every few, the offers taking turns. With too few
 * designs to reach the first turn, one offer closes the round, so it is still seen.
 */
export function slidesWithOffers<T extends { id: number }>(
  designs: readonly T[],
  offers: readonly Offer[]
): ShowroomSlide<T>[] {
  const slides: ShowroomSlide<T>[] = [];
  let shown = 0;
  const addOffer = (): void => {
    const offer = offers[shown % offers.length];
    slides.push({ kind: 'offer', key: `offer-${offer.id}-${shown}`, offer });
    shown += 1;
  };
  designs.forEach((design, index) => {
    slides.push({ kind: 'design', key: `design-${design.id}`, design });
    if (offers.length && (index + 1) % DESIGNS_PER_OFFER === 0) addOffer();
  });
  if (offers.length && designs.length && shown === 0) addOffer();
  return slides;
}

/**
 * How large to set an offer, to fill the width on one line where it can: a short
 * "10% off" huge, a long one smaller, and never too tall for a screen on its side.
 */
export function offerTitleSize(
  title: string,
  width: number,
  height: number
): number {
  const length = title.trim().length;
  // Set in the serif, whose letters run smaller than Inter's at the same size.
  const share = length <= 8 ? 0.2 : length <= 14 ? 0.14 : 0.1;
  return Math.round(Math.min(width * share, height * 0.14, 132));
}
