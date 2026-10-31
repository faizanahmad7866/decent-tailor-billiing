import { File, Paths } from 'expo-file-system';
import { OFFER_ICONS, type Offer, type OfferIcon } from '../utils/offers';

// The showroom's offers. A small JSON file, as for the printer: they run for days,
// not years, and belong to this phone, so they are not part of a backup.

function file(): File {
  return new File(Paths.document, 'offers.json');
}

const isOffer = (value: Partial<Offer> | null): value is Offer =>
  !!value &&
  typeof value.id === 'number' &&
  typeof value.title === 'string' &&
  typeof value.endsAt === 'string' &&
  !Number.isNaN(new Date(value.endsAt).getTime());

export function parseOffers(text: string): Offer[] {
  const saved: unknown = JSON.parse(text);
  if (!Array.isArray(saved)) return [];
  return saved.filter(isOffer).map((offer) => ({
    id: offer.id,
    occasion: typeof offer.occasion === 'string' ? offer.occasion : '',
    title: offer.title,
    note: typeof offer.note === 'string' ? offer.note : '',
    icon: OFFER_ICONS.includes(offer.icon as OfferIcon)
      ? offer.icon
      : OFFER_ICONS[0],
    endsAt: offer.endsAt,
    on: offer.on !== false,
  }));
}

export function loadOffers(): Offer[] {
  try {
    const saved = file();
    return saved.exists ? parseOffers(saved.textSync()) : [];
  } catch {
    // An unreadable file only means no offers show.
    return [];
  }
}

export function saveOffers(offers: readonly Offer[]): void {
  file().write(JSON.stringify(offers));
}
