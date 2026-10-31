import type { Offer } from '../utils/offers';
import { spokenOffer, spokenOfferEnd, spokenOfferText } from './spokenOffer';

const NOW = new Date(2026, 9, 31, 11, 0);
const day = (offset: number): string =>
  new Date(2026, 9, 31 + offset).toISOString();

const offer = (over: Partial<Offer> = {}): Offer => ({
  id: 1,
  occasion: 'Eid offer',
  title: '10% off',
  note: 'On all Jodhpuri suits',
  icon: 'gift',
  endsAt: day(15),
  on: true,
  ...over,
});

describe('spokenOfferText', () => {
  it.each([
    ['10% off', '10 परसेंट डिस्काउंट'],
    ['Flat 20 percent off', 'फ्लैट 20 परसेंट डिस्काउंट'],
    ['Upto 30% off', 'अप टू 30 परसेंट डिस्काउंट'],
    ['₹500 off', '500 रुपये डिस्काउंट'],
    ['Rs. 1,000 off', '1000 रुपये डिस्काउंट'],
    ['500 Rs discount', '500 रुपये डिस्काउंट'],
    ['Buy 1 Get 1 Free', 'बाय 1 गेट 1 फ्री'],
    ['Eid offer', 'ईद ऑफर'],
    ['Diwali Sale', 'दिवाली सेल'],
    ['New Year offer', 'न्यू ईयर ऑफर'],
  ])('%s → %s', (text, said) => {
    expect(spokenOfferText(text)).toBe(said);
  });

  it('leaves an offer already written in Hindi as it is', () => {
    expect(spokenOfferText(' ईद पर 10% छूट ')).toBe('ईद पर 10% छूट');
  });

  it('says nothing for nothing', () => {
    expect(spokenOfferText('  ')).toBe('');
  });
});

describe('spokenOfferEnd', () => {
  it('names the last day', () => {
    expect(spokenOfferEnd(day(15), NOW)).toBe('यह ऑफर 15 नवंबर तक है');
  });

  it('says today and tomorrow as such', () => {
    expect(spokenOfferEnd(day(0), NOW)).toBe('यह ऑफर सिर्फ आज तक है');
    expect(spokenOfferEnd(day(1), NOW)).toBe('यह ऑफर कल तक है');
  });
});

describe('spokenOffer', () => {
  it('says the occasion, the offer, its line and until when', () => {
    expect(spokenOffer(offer(), NOW)).toBe(
      'ईद ऑफर। 10 परसेंट डिस्काउंट। ऑन ऑल जोधपुरी सूट्स। यह ऑफर 15 नवंबर तक है'
    );
  });

  it('calls an offer with no occasion a special offer, and skips an empty line', () => {
    expect(spokenOffer(offer({ occasion: '', note: ' ' }), NOW)).toBe(
      'स्पेशल ऑफर। 10 परसेंट डिस्काउंट। यह ऑफर 15 नवंबर तक है'
    );
  });
});
