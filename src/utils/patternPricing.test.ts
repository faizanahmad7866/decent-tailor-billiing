import {
  designPriceText,
  patternPrice,
  priceToSave,
  shownPrice,
} from './patternPricing';

describe('patternPrice', () => {
  it('adds each cloth at its rate for its meters, and the stitching', () => {
    // 3 m at ₹1,300 and 1.5 m at ₹400, plus ₹1,500 stitching.
    const price = patternPrice(
      [
        { pricePerMeterPaise: 130000, lengthCm: 300 },
        { pricePerMeterPaise: 40000, lengthCm: 150 },
      ],
      150000
    );
    expect(price).toEqual({
      clothPaise: 390000 + 60000,
      stitchingPaise: 150000,
      totalPaise: 600000,
    });
  });

  it('is just the stitching for a design with no cloth yet', () => {
    expect(patternPrice([], 150000).totalPaise).toBe(150000);
  });

  it('rounds a part-paise length the way a bill does', () => {
    // 2.35 m at ₹333.33 a meter is 78332.55 paise.
    expect(
      patternPrice([{ pricePerMeterPaise: 33333, lengthCm: 235 }], 0).clothPaise
    ).toBe(78333);
  });
});

describe('shownPrice', () => {
  it('works the price out when there are cloths or stitching', () => {
    expect(
      shownPrice([{ pricePerMeterPaise: 100000, lengthCm: 200 }], 50000, 999)
    ).toBe(250000);
    expect(shownPrice([], 50000, 999)).toBe(50000);
  });

  it('keeps the given price for a design with neither', () => {
    expect(shownPrice([], 0, 1500000)).toBe(1500000);
  });
});

describe('priceToSave', () => {
  const line = { pricePerMeterPaise: 100000, lengthCm: 200 };

  it('works the price out from cloths or stitching, whatever it was before', () => {
    const before = { cloths: [], stitchingPaise: 0, pricePaise: 1500000 };
    expect(priceToSave([line], 50000, before)).toBe(250000);
    expect(priceToSave([], 50000, before)).toBe(50000);
  });

  it('keeps the price of an old design given one by hand, when only its note changes', () => {
    expect(
      priceToSave([], 0, { cloths: [], stitchingPaise: 0, pricePaise: 1500000 })
    ).toBe(1500000);
  });

  it('has no price once the cloths that made it are taken off', () => {
    expect(
      priceToSave([], 0, {
        cloths: [line],
        stitchingPaise: 50000,
        pricePaise: 250000,
      })
    ).toBe(0);
  });

  it('has no price for a new design with neither', () => {
    expect(priceToSave([], 0, null)).toBe(0);
  });
});

describe('designPriceText', () => {
  it('is the amount, or asks where there is none rather than saying ₹0', () => {
    expect(designPriceText(640000)).toBe('₹6,400');
    expect(designPriceText(0)).toBe('Ask for price');
  });
});
