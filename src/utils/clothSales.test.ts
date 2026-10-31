import {
  salesRange,
  summarizeClothSales,
  type ClothSaleLine,
} from './clothSales';

const range = { from: new Date(2026, 9, 1), to: new Date(2026, 9, 31) };
const inside = new Date(2026, 9, 15, 12).toISOString();

const line = (over: Partial<ClothSaleLine>): ClothSaleLine => ({
  billId: 1,
  createdAt: inside,
  clothId: 1,
  clothName: 'Armani',
  clothNameHindi: 'अरमानी',
  variant: null,
  lengthCm: 100,
  amountPaise: 10000,
  ...over,
});

describe('summarizeClothSales', () => {
  it('adds up the whole business and each cloth, most sold first', () => {
    const summary = summarizeClothSales(
      [
        line({ billId: 1, clothId: 1, lengthCm: 300, amountPaise: 300000 }),
        line({ billId: 2, clothId: 1, lengthCm: 100, amountPaise: 100000 }),
        line({
          billId: 2,
          clothId: 2,
          clothName: 'Lining',
          clothNameHindi: null,
          lengthCm: 250,
          amountPaise: 600000,
        }),
      ],
      range
    );
    expect(summary).toMatchObject({
      amountPaise: 1000000,
      lengthCm: 650,
      billCount: 2,
    });
    expect(summary.cloths.map((c) => c.clothName)).toEqual([
      'Lining',
      'Armani',
    ]);
    expect(summary.cloths[1]).toMatchObject({
      lengthCm: 400,
      amountPaise: 400000,
      billCount: 2,
      share: 0.4,
    });
  });

  it('leaves out what falls outside the days, on either side', () => {
    const summary = summarizeClothSales(
      [
        line({ createdAt: new Date(2026, 8, 30, 23).toISOString() }),
        line({ createdAt: new Date(2026, 10, 1, 0, 1).toISOString() }),
      ],
      range
    );
    expect(summary).toEqual({
      amountPaise: 0,
      lengthCm: 0,
      billCount: 0,
      cloths: [],
    });
  });

  it('counts the first and the last day whole', () => {
    const summary = summarizeClothSales(
      [
        line({ createdAt: new Date(2026, 9, 1, 0, 0).toISOString() }),
        line({ createdAt: new Date(2026, 9, 31, 23, 59).toISOString() }),
      ],
      range
    );
    expect(summary.lengthCm).toBe(200);
  });

  it('counts a bill once, however many lines of a cloth it has', () => {
    const summary = summarizeClothSales(
      [line({ billId: 7 }), line({ billId: 7 })],
      range
    );
    expect(summary.billCount).toBe(1);
    expect(summary.cloths[0].billCount).toBe(1);
  });

  it('splits a cloth by its types, ignoring capitals, with what had none', () => {
    const [armani] = summarizeClothSales(
      [
        line({ variant: 'Royal', lengthCm: 100, amountPaise: 100000 }),
        line({ variant: ' royal ', lengthCm: 100, amountPaise: 100000 }),
        line({ variant: 'Classic', lengthCm: 100, amountPaise: 300000 }),
        line({ variant: null, lengthCm: 50, amountPaise: 50000 }),
      ],
      range
    ).cloths;
    expect(armani.types).toEqual([
      { name: 'Classic', lengthCm: 100, amountPaise: 300000 },
      { name: 'Royal', lengthCm: 200, amountPaise: 200000 },
      { name: null, lengthCm: 50, amountPaise: 50000 },
    ]);
  });

  it('has no split for a cloth never sold with a type', () => {
    const [armani] = summarizeClothSales([line({}), line({})], range).cloths;
    expect(armani.types).toEqual([]);
  });

  it('keeps a cloth deleted from the catalog, by its name', () => {
    const { cloths } = summarizeClothSales(
      [
        line({ clothId: null, clothName: 'Old Silk' }),
        line({ clothId: null, clothName: 'old silk ' }),
      ],
      range
    );
    expect(cloths).toHaveLength(1);
    expect(cloths[0].lengthCm).toBe(200);
  });
});

describe('salesRange', () => {
  it('goes back whole months from today', () => {
    const now = new Date(2026, 9, 30, 15);
    expect(salesRange(1, now)).toEqual({
      from: new Date(2026, 8, 30),
      to: new Date(2026, 9, 30),
    });
    expect(salesRange(6, now).from).toEqual(new Date(2026, 3, 30));
  });

  it('stops at the end of a shorter month', () => {
    expect(salesRange(1, new Date(2026, 2, 31)).from).toEqual(
      new Date(2026, 1, 28)
    );
  });
});
