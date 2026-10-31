import {
  daysLeft,
  liveOffers,
  offerEndAfter,
  offerTitleSize,
  slidesWithOffers,
  type Offer,
} from './offers';

const NOW = new Date(2026, 9, 31, 15, 30);

const offer = (id: number, changes: Partial<Offer> = {}): Offer => ({
  id,
  occasion: '',
  title: '10% off',
  note: '',
  icon: 'sparkles',
  endsAt: new Date(2026, 10, 5).toISOString(),
  on: true,
  ...changes,
});

const designs = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: index + 1 }));

const order = (slides: ReturnType<typeof slidesWithOffers>) =>
  slides.map((slide) => (slide.kind === 'offer' ? 'O' : 'D')).join('');

describe('daysLeft', () => {
  it('counts whole days to the last day, whatever the hour', () => {
    expect(daysLeft(new Date(2026, 10, 5).toISOString(), NOW)).toBe(5);
    expect(daysLeft(new Date(2026, 9, 31).toISOString(), NOW)).toBe(0);
    expect(daysLeft(new Date(2026, 9, 30).toISOString(), NOW)).toBe(-1);
  });
});

describe('liveOffers', () => {
  it('runs through its last day, and stops the day after', () => {
    const lastDay = offer(1, { endsAt: new Date(2026, 9, 31).toISOString() });
    const ended = offer(2, { endsAt: new Date(2026, 9, 30).toISOString() });
    expect(liveOffers([lastDay, ended], NOW)).toEqual([lastDay]);
  });

  it('leaves out one switched off', () => {
    expect(liveOffers([offer(1, { on: false })], NOW)).toEqual([]);
  });
});

describe('offerEndAfter', () => {
  it('counts today as the first day', () => {
    expect(daysLeft(offerEndAfter(7, NOW), NOW)).toBe(6);
    expect(daysLeft(offerEndAfter(1, NOW), NOW)).toBe(0);
  });
});

describe('slidesWithOffers', () => {
  it('puts an offer after every four designs', () => {
    expect(order(slidesWithOffers(designs(9), [offer(1)]))).toBe('DDDDODDDDOD');
  });

  it('lets the offers take turns, each slide with a key of its own', () => {
    const slides = slidesWithOffers(designs(12), [offer(1), offer(2)]);
    const shown = slides.flatMap((slide) =>
      slide.kind === 'offer' ? [slide.offer.id] : []
    );
    expect(shown).toEqual([1, 2, 1]);
    expect(new Set(slides.map((slide) => slide.key)).size).toBe(slides.length);
  });

  it('still shows an offer among too few designs to reach its turn', () => {
    expect(order(slidesWithOffers(designs(2), [offer(1)]))).toBe('DDO');
  });

  it('is just the designs with no offer, and nothing with no designs', () => {
    expect(order(slidesWithOffers(designs(5), []))).toBe('DDDDD');
    expect(slidesWithOffers([], [offer(1)])).toEqual([]);
  });
});

describe('offerTitleSize', () => {
  it('sets a short offer larger than a long one', () => {
    const short = offerTitleSize('10% off', 412, 800);
    const long = offerTitleSize('Buy one suit get one shirt', 412, 800);
    expect(short).toBeGreaterThan(long);
  });

  it('keeps within a screen on its side', () => {
    expect(offerTitleSize('10% off', 900, 400)).toBeLessThanOrEqual(56);
  });
});
