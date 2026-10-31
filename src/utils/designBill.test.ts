import type { PatternItem } from '../repositories/patternRepo';
import { EMPTY_BILL_FORM, draftTotals, validateBillForm } from './billForm';
import { billLinesFromDesign } from './designBill';

const design: PatternItem = {
  id: 7,
  categoryId: 1,
  categoryName: 'Jodhpuri',
  name: 'Royal Jodhpuri Suit',
  // 3 m at ₹1,400 and 2.5 m at ₹400, plus ₹1,500 stitching.
  pricePaise: 670000,
  clothPaise: 520000,
  stitchingPaise: 150000,
  note: null,
  noteHindi: null,
  cloths: [
    {
      clothId: 1,
      clothName: 'Armani',
      nameHindi: 'अरमानी',
      imageName: 'a.jpg',
      variant: 'Royal blue',
      // ₹1,300 catalog rate and ₹100 extra.
      pricePerMeterPaise: 140000,
      extraPerMeterPaise: 10000,
      lengthCm: 300,
      amountPaise: 420000,
    },
    {
      clothId: null,
      clothName: 'Lining',
      nameHindi: null,
      imageName: null,
      variant: null,
      pricePerMeterPaise: 40000,
      extraPerMeterPaise: 0,
      lengthCm: 250,
      amountPaise: 100000,
    },
  ],
  images: [],
  videoName: null,
};

let counter = 0;
const nextKey = (): string => String(++counter);

describe('billLinesFromDesign', () => {
  const { cloths, garments } = billLinesFromDesign(design, nextKey);

  it('lays each cloth out as a bill line: type, extra and meters, at the catalog rate', () => {
    expect(cloths).toHaveLength(2);
    expect(cloths[0]).toMatchObject({
      clothId: 1,
      clothName: 'Armani',
      clothNameHindi: 'अरमानी',
      variant: 'Royal blue',
      pricePerMeterPaise: 130000,
      extra: '100',
      meters: '3',
    });
    expect(cloths[1]).toMatchObject({
      clothId: null,
      variant: '',
      extra: '',
      pricePerMeterPaise: 40000,
      meters: '2.5',
    });
  });

  it('adds one garment line named for the design, charged the stitching', () => {
    expect(garments).toEqual([
      expect.objectContaining({
        name: 'Royal Jodhpuri Suit',
        custom: true,
        quantity: 1,
        making: '1500',
      }),
    ]);
  });

  it('carries a reduction as a minus, so the bill is at the rate of the design', () => {
    const { cloths: royal } = billLinesFromDesign(
      {
        ...design,
        cloths: [
          {
            ...design.cloths[0],
            variant: 'Royal',
            pricePerMeterPaise: 100000,
            extraPerMeterPaise: -20000,
          },
        ],
      },
      nextKey
    );
    expect(royal[0]).toMatchObject({
      pricePerMeterPaise: 120000,
      extra: '-200',
    });
  });

  it('gives every line its own key', () => {
    const keys = [...cloths, ...garments].map((line) => line.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('makes a bill that comes to the design price, and that can be saved', () => {
    const form = { ...EMPTY_BILL_FORM, cloths, garments };
    expect(draftTotals(form).totalPaise).toBe(design.pricePaise);
    expect(validateBillForm(form)).toMatchObject({ ok: true });
  });

  it('keeps the design on the bill for a design with no stitching charge', () => {
    const { garments: none } = billLinesFromDesign(
      { ...design, stitchingPaise: 0 },
      nextKey
    );
    expect(none[0]).toMatchObject({ name: 'Royal Jodhpuri Suit', making: '0' });
    const form = { ...EMPTY_BILL_FORM, cloths, garments: none };
    expect(validateBillForm(form)).toMatchObject({ ok: true });
  });
});
