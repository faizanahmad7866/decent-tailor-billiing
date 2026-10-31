import type { Bill } from '../repositories/billRepo';
import {
  draftTotals,
  EMPTY_BILL_FORM,
  draftLines,
  formFromBill,
  clothRate,
  readDiscount,
  validateBillForm,
  type BillForm,
} from './billForm';

const filledForm: BillForm = {
  customerName: '  Imran   Shaikh ',
  customerMobile: '98765 43210',
  dtNumber: '',
  cloths: [
    {
      key: 'c1',
      clothId: 7,
      clothName: 'Linen White',
      clothNameHindi: null,
      imageName: null,
      pricePerMeterPaise: 45000,
      variant: '',
      extra: '',
      meters: '2.5',
    },
  ],
  garments: [
    { key: 'g1', name: 'Shirt', custom: false, quantity: 2, making: '400' },
  ],
  discountMode: 'percent',
  discount: '10',
  paidNow: '500',
};

describe('readDiscount', () => {
  it('reads blank as no discount', () => {
    expect(readDiscount('amount', '')).toEqual({ kind: 'amount', paise: 0 });
    expect(readDiscount('percent', ' ')).toEqual({
      kind: 'percent',
      percent: 0,
    });
  });

  it('rejects a percentage over 100', () => {
    expect(readDiscount('percent', '120')).toBeNull();
  });
});

describe('draftTotals', () => {
  it('counts lines that are not filled in yet as nothing', () => {
    const totals = draftTotals({
      ...filledForm,
      cloths: [{ ...filledForm.cloths[0], meters: '' }],
      discount: 'abc',
    });
    expect(totals.totalPaise).toBe(80000);
  });
});

describe('validateBillForm', () => {
  it('turns a filled form into a bill to save', () => {
    expect(validateBillForm(filledForm)).toEqual({
      ok: true,
      bill: {
        customerName: 'Imran Shaikh',
        customerMobile: '9876543210',
        dtNumber: null,
        cloths: [
          {
            clothId: 7,
            clothName: 'Linen White',
            clothNameHindi: 'लिनन व्हाइट',
            variant: null,
            pricePerMeterPaise: 45000,
            extraPerMeterPaise: 0,
            lengthCm: 250,
          },
        ],
        garments: [{ name: 'Shirt', quantity: 2, makingPaise: 40000 }],
        discount: { kind: 'percent', percent: 10 },
        paidNowPaise: 50000,
      },
    });
  });

  it('needs something on the bill, but not a customer name', () => {
    const result = validateBillForm(EMPTY_BILL_FORM);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.items).toBe('Add a cloth or a garment to make a bill');
    expect(Object.keys(result.errors)).not.toContain('customerName');
  });

  it('makes a bill with no customer name at all', () => {
    const result = validateBillForm({
      ...filledForm,
      customerName: '   ',
      customerMobile: '',
      dtNumber: '',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bill.customerName).toBe('');
    expect(result.bill.customerMobile).toBeNull();
  });

  it('points at the exact line that is missing a number', () => {
    const result = validateBillForm({
      ...filledForm,
      cloths: [{ ...filledForm.cloths[0], meters: '' }],
      garments: [{ ...filledForm.garments[0], making: '' }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.cloths).toEqual({ c1: { meters: 'Enter meters' } });
    expect(result.errors.garments).toEqual({
      g1: { making: 'Enter making charge' },
    });
  });

  it('keeps the DT number tidied, without a DT typed into the box', () => {
    const dt = (dtNumber: string) => {
      const result = validateBillForm({ ...filledForm, dtNumber });
      return result.ok ? result.bill.dtNumber : 'invalid';
    };
    expect(dt('')).toBeNull();
    expect(dt('  a-1 ')).toBe('A-1');
    expect(dt('DT-5')).toBe('-5');
  });

  it('charges the extra per meter on top of the catalog price', () => {
    // Armani at ₹1,200 with ₹100 extra is ₹1,300 a meter on this bill.
    const armani = {
      ...filledForm.cloths[0],
      clothName: 'Armani',
      pricePerMeterPaise: 120000,
      variant: '  Royal   Blue ',
      extra: '100',
      meters: '2',
    };
    const result = validateBillForm({ ...filledForm, cloths: [armani] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bill.cloths).toEqual([
      {
        clothId: 7,
        clothName: 'Armani',
        clothNameHindi: 'अरमानी',
        variant: 'Royal Blue',
        pricePerMeterPaise: 130000,
        extraPerMeterPaise: 10000,
        lengthCm: 200,
      },
    ]);
    expect(
      draftTotals({ ...filledForm, cloths: [armani], discount: '' }).clothPaise
    ).toBe(260000);
  });

  it('takes a minus extra off the catalog price: Royal Armani at ₹1,000 where Armani is ₹1,200', () => {
    const royal = {
      ...filledForm.cloths[0],
      clothName: 'Armani',
      pricePerMeterPaise: 120000,
      variant: 'Royal',
      extra: '-200',
      meters: '2',
    };
    const form = { ...filledForm, cloths: [royal], discount: '' };
    expect(clothRate(royal)).toBe(100000);
    const result = validateBillForm(form);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bill.cloths[0]).toMatchObject({
      pricePerMeterPaise: 100000,
      extraPerMeterPaise: -20000,
      lengthCm: 200,
    });
    expect(draftTotals(form).clothPaise).toBe(200000);
  });

  it('refuses a reduction that takes the cloth to nothing, on that cloth', () => {
    const free = {
      ...filledForm.cloths[0],
      pricePerMeterPaise: 120000,
      extra: '-1200',
      meters: '2',
    };
    const result = validateBillForm({ ...filledForm, cloths: [free] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.cloths[free.key]?.extra).toBe(
      "Take off less than ₹1,200, the cloth's price"
    );
  });

  it("writes the bill's cloth with the Hindi saved for it, if any", () => {
    const saved = validateBillForm({
      ...filledForm,
      cloths: [{ ...filledForm.cloths[0], clothNameHindi: 'लिनेन सफ़ेद' }],
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.bill.cloths[0].clothNameHindi).toBe('लिनेन सफ़ेद');
  });

  it('rejects an extra that is not an amount', () => {
    const result = validateBillForm({
      ...filledForm,
      // A minus is a reduction now; a doubled sign or letters are not an amount.
      cloths: [{ ...filledForm.cloths[0], extra: '--100' }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.cloths).toEqual({
      c1: { extra: 'Enter an amount like 100' },
    });
  });

  it('refuses a payment above the bill total', () => {
    const result = validateBillForm({ ...filledForm, paidNow: '99999' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.paidNow).toBe('More than the bill total');
  });

  it('rejects a short mobile number but allows none', () => {
    const short = validateBillForm({ ...filledForm, customerMobile: '98765' });
    expect(short.ok).toBe(false);
    expect(validateBillForm({ ...filledForm, customerMobile: '' }).ok).toBe(
      true
    );
  });
});

describe('validateBillForm while editing', () => {
  it('ignores "paid now", since payments are not edited here', () => {
    const result = validateBillForm(
      { ...filledForm, paidNow: 'garbage' },
      { editingPaidPaise: 20000 }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bill.paidNowPaise).toBe(0);
  });

  it('refuses a bill that would come to less than has been paid', () => {
    // filledForm comes to ₹1,125 + ₹800 − 10%; ₹5,000 paid is far above that.
    const result = validateBillForm(filledForm, { editingPaidPaise: 500000 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.total).toBe(
      "The bill can't come to less than the ₹5,000 already paid"
    );
  });

  it('allows a bill that comes to exactly what has been paid', () => {
    const total = draftTotals(filledForm).totalPaise;
    expect(validateBillForm(filledForm, { editingPaidPaise: total }).ok).toBe(
      true
    );
  });
});

describe('formFromBill', () => {
  const saved: Bill = {
    id: 8,
    customerName: 'Imran Shaikh',
    customerMobile: null,
    dtNumber: null,
    clothText: null,
    totalLengthCm: 0,
    totalPaise: 655000,
    paidPaise: 50000,
    createdAt: '2026-10-28T10:00:00Z',
    clothPaise: 325000,
    makingPaise: 350000,
    discountPaise: 20000,
    cloths: [
      {
        id: 1,
        clothId: 7,
        clothName: 'Armani',
        clothNameHindi: null,
        imageName: null,
        variant: 'Royal Blue',
        pricePerMeterPaise: 130000,
        extraPerMeterPaise: 10000,
        lengthCm: 250,
        amountPaise: 325000,
      },
    ],
    garments: [
      {
        id: 1,
        name: 'Shirt',
        quantity: 2,
        makingPaise: 50000,
        amountPaise: 100000,
      },
      {
        id: 2,
        name: 'Sherwani',
        quantity: 1,
        makingPaise: 250000,
        amountPaise: 250000,
      },
    ],
    payments: [],
  };
  let n = 0;
  const form = formFromBill(
    saved,
    ['Shirt', 'Pant'],
    new Map([[7, 'photo.jpg']]),
    () => `k${++n}`
  );

  it('brings the DT number back to its box, and none as blank', () => {
    expect(form.dtNumber).toBe('');
    const withDt = formFromBill(
      { ...saved, dtNumber: 'A-1' },
      [],
      new Map(),
      () => `d${++n}`
    );
    expect(withDt.dtNumber).toBe('A-1');
  });

  it('brings back the customer and the catalog price, extra apart', () => {
    expect(form.customerName).toBe('Imran Shaikh');
    expect(form.customerMobile).toBe('');
    expect(form.cloths[0]).toMatchObject({
      clothId: 7,
      imageName: 'photo.jpg',
      pricePerMeterPaise: 120000,
      variant: 'Royal Blue',
      extra: '100',
      meters: '2.5',
    });
  });

  it('opens a bill with a reduction as the minus, at the catalog price, and back again', () => {
    // Royal Armani sold at ₹1,000 where the catalog has Armani at ₹1,200.
    const royal: Bill = {
      ...saved,
      totalPaise: 380000,
      clothPaise: 250000,
      cloths: [
        {
          ...saved.cloths[0],
          variant: 'Royal',
          pricePerMeterPaise: 100000,
          extraPerMeterPaise: -20000,
        },
      ],
    };
    const opened = formFromBill(
      royal,
      ['Shirt'],
      new Map([[7, 'photo.jpg']]),
      () => `r${++n}`
    );
    expect(opened.cloths[0]).toMatchObject({
      pricePerMeterPaise: 120000,
      extra: '-200',
    });
    expect(clothRate(opened.cloths[0])).toBe(100000);
    const again = validateBillForm(opened, { editingPaidPaise: 50000 });
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.bill.cloths[0]).toMatchObject({
      pricePerMeterPaise: 100000,
      extraPerMeterPaise: -20000,
    });
  });

  it('marks garments outside the usual list as typed-in', () => {
    expect(form.garments.map((g) => [g.name, g.custom, g.making])).toEqual([
      ['Shirt', false, '500'],
      ['Sherwani', true, '2500'],
    ]);
  });

  it('brings the discount back as an amount and starts nothing paid-now', () => {
    expect(form.discountMode).toBe('amount');
    expect(form.discount).toBe('200');
    expect(form.paidNow).toBe('');
  });

  it('is the bill again once validated, with the same total', () => {
    const result = validateBillForm(form, { editingPaidPaise: 50000 });
    expect(result.ok).toBe(true);
    expect(draftTotals(form).totalPaise).toBe(saved.totalPaise);
  });
});

describe('draftLines', () => {
  it('works each line out the way the bill will be billed', () => {
    const { cloths, garments } = draftLines({
      ...filledForm,
      cloths: [{ ...filledForm.cloths[0], extra: '100', variant: ' Royal ' }],
    });
    // 2.5 m at the catalog 450 plus 100 extra: the rate charged is 550.
    expect(cloths).toEqual([
      {
        key: 'c1',
        clothName: 'Linen White',
        clothNameHindi: null,
        imageName: null,
        variant: 'Royal',
        lengthCm: 250,
        pricePerMeterPaise: 55000,
        extraPerMeterPaise: 10000,
        amountPaise: 137500,
      },
    ]);
    expect(garments).toEqual([
      {
        key: 'g1',
        name: 'Shirt',
        quantity: 2,
        makingPaise: 40000,
        amountPaise: 80000,
      },
    ]);
  });

  it('counts what is not yet a number as nothing, and a blank type as none', () => {
    const { cloths, garments } = draftLines({
      ...filledForm,
      cloths: [
        { ...filledForm.cloths[0], meters: '', extra: 'x', variant: '  ' },
      ],
      garments: [{ ...filledForm.garments[0], making: '' }],
    });
    expect(cloths[0]).toMatchObject({
      lengthCm: 0,
      extraPerMeterPaise: 0,
      pricePerMeterPaise: 45000,
      amountPaise: 0,
      variant: null,
    });
    expect(garments[0]).toMatchObject({ makingPaise: 0, amountPaise: 0 });
  });

  it('is empty for an empty form', () => {
    expect(draftLines({ ...filledForm, cloths: [], garments: [] })).toEqual({
      cloths: [],
      garments: [],
    });
  });
});
