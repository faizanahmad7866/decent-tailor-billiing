import type { ClothType } from '../repositories/clothTypeRepo';
import type { PatternCloth } from '../repositories/patternRepo';
import {
  fabricLabel,
  fabricOptions,
  priceWithFabrics,
  type FabricLine,
} from './showroomPricing';

const armani: PatternCloth = {
  clothId: 10,
  clothName: 'Armani Suiting',
  nameHindi: 'अरमानी सूटिंग',
  imageName: 'royal.jpg',
  variant: 'Royal',
  // ₹1,600 a meter for Royal, with no extra.
  pricePerMeterPaise: 160000,
  extraPerMeterPaise: 0,
  lengthCm: 350,
  amountPaise: 560000,
};

const type = (
  id: number,
  name: string,
  rupees: number,
  imageName: string | null = null
): ClothType => ({
  id,
  clothId: 10,
  name,
  pricePerMeterPaise: rupees * 100,
  imageName,
});

const TYPES = [
  type(1, 'Classic', 1200),
  type(2, 'Royal', 1600, 'royal.jpg'),
  type(3, 'Signature', 2200, 'signature.jpg'),
];

describe('fabricOptions', () => {
  it('offers every type, cheapest first, the design’s own marked', () => {
    const options = fabricOptions(armani, TYPES);
    expect(options.map((o) => [o.name, o.ratePaise, o.own])).toEqual([
      ['Classic', 120000, false],
      ['Royal', 160000, true],
      ['Signature', 220000, false],
    ]);
    expect(options[2].imageName).toBe('signature.jpg');
  });

  it('adds the design’s extra to every type, as to its own', () => {
    const options = fabricOptions(
      { ...armani, pricePerMeterPaise: 180000, extraPerMeterPaise: 20000 },
      TYPES
    );
    expect(options.map((o) => o.ratePaise)).toEqual([140000, 180000, 240000]);
  });

  it('drops a type a reduction would take to nothing', () => {
    const options = fabricOptions(
      { ...armani, pricePerMeterPaise: 40000, extraPerMeterPaise: -120000 },
      TYPES
    );
    expect(options.map((o) => o.name)).toEqual(['Royal', 'Signature']);
  });

  it('keeps a cloth with no type, or no types, as it is', () => {
    const plain = { ...armani, variant: null };
    expect(fabricOptions(plain, [])).toEqual([
      {
        key: '',
        name: '',
        ratePaise: 160000,
        imageName: 'royal.jpg',
        own: true,
      },
    ]);
    expect(fabricOptions(plain, TYPES)).toHaveLength(4);
  });

  it('matches the design’s own type whatever its case or spaces', () => {
    const options = fabricOptions({ ...armani, variant: ' royal ' }, TYPES);
    expect(options).toHaveLength(3);
  });
});

describe('priceWithFabrics', () => {
  const lines: FabricLine[] = [
    { cloth: armani, options: fabricOptions(armani, TYPES) },
  ];
  const item = { stitchingPaise: 1800000, pricePaise: 2360000 };

  it('comes to the design’s own price with nothing chosen', () => {
    const price = priceWithFabrics(item, lines, []);
    expect(price.totalPaise).toBe(2360000);
    expect(price.clothPaise).toBe(560000);
    expect(price.changed).toBe(false);
    expect(fabricLabel(price.lines[0])).toBe('Armani Suiting — Royal');
  });

  it('prices the fabric chosen at its own rate, for the same meters', () => {
    const price = priceWithFabrics(item, lines, ['signature']);
    // 3.5 m × ₹2,200 = ₹7,700, plus ₹18,000 stitching.
    expect(price.clothPaise).toBe(770000);
    expect(price.totalPaise).toBe(2570000);
    expect(price.changed).toBe(true);
    expect(fabricLabel(price.lines[0])).toBe('Armani Suiting — Signature');
  });

  it('keeps the design’s own fabric for a choice it does not have', () => {
    expect(priceWithFabrics(item, lines, ['velvet']).totalPaise).toBe(2360000);
  });

  it('keeps the price given by hand to a design with no cloth or stitching', () => {
    const old = priceWithFabrics(
      { stitchingPaise: 0, pricePaise: 450000 },
      [],
      []
    );
    expect(old.totalPaise).toBe(450000);
    const none = priceWithFabrics({ stitchingPaise: 0, pricePaise: 0 }, [], []);
    expect(none.totalPaise).toBe(0);
  });
});
