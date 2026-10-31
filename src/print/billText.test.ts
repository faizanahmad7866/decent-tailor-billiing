import type { Bill } from '../repositories/billRepo';
import { buildBillText } from './billText';

const bill: Bill = {
  id: 8,
  customerName: 'Imran Shaikh',
  customerMobile: '9876543210',
  dtNumber: null,
  clothText: 'Armani Royal Blue',
  totalLengthCm: 250,
  totalPaise: 405000,
  paidPaise: 50000,
  createdAt: new Date(2026, 9, 28, 15, 50).toISOString(),
  clothPaise: 325000,
  makingPaise: 100000,
  discountPaise: 20000,
  cloths: [
    {
      id: 1,
      clothId: 1,
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
  ],
  payments: [{ id: 1, amountPaise: 50000, createdAt: '2026-10-28T10:00:00Z' }],
};

describe('buildBillText', () => {
  const text = buildBillText(bill);

  it('carries the DT number where there is one', () => {
    expect(text).not.toContain('DT ');
    expect(buildBillText({ ...bill, dtNumber: 'A-1' })).toContain('DT A-1');
  });

  it('names the shop, the bill and the customer', () => {
    expect(text).toContain('*DECENT TAILOR*');
    expect(text).toContain('Bill No. 8 · 28 Oct 2026');
    expect(text).toContain('Customer: Imran Shaikh');
  });

  it('has no customer line when the bill has no name', () => {
    const none = buildBillText({ ...bill, customerName: '' });
    expect(none).not.toContain('Customer:');
    expect(none).toContain('Bill No. 8');
    expect(none).toContain('*Total: ₹4,050*');
  });

  it('writes the cloth in Hindi under its English name', () => {
    const lines = text.split('\n');
    const at = lines.indexOf('Armani — Royal Blue');
    // The type follows the name in Hindi too, as in the English line above.
    expect(lines[at + 1]).toBe('अरमानी — रॉयल ब्लू');
  });

  it('lists each line with how it was worked out', () => {
    expect(text).toContain('Armani — Royal Blue');
    expect(text).toContain('2.5 m × ₹1,300 = ₹3,250');
    expect(text).toContain('Shirt');
    expect(text).toContain('2 × ₹500 = ₹1,000');
  });

  it('shows only the rate charged, never the extra', () => {
    expect(text).not.toContain('₹1,200');
    expect(text).not.toContain('extra');
  });

  it('ends the totals with what is still due', () => {
    expect(text).toContain('Discount: -₹200');
    expect(text).toContain('*Total: ₹4,050*');
    expect(text).toContain('Paid: ₹500');
    expect(text).toContain('*Balance due: ₹3,550*');
  });

  it('says paid in full once nothing is due', () => {
    const paid = buildBillText({ ...bill, paidPaise: bill.totalPaise });
    expect(paid).toContain('*Paid in full. Thank you!*');
    expect(paid).not.toContain('Balance due');
  });

  it('leaves out sections the bill does not have', () => {
    const stitchingOnly = buildBillText({
      ...bill,
      cloths: [],
      clothPaise: 0,
      discountPaise: 0,
    });
    expect(stitchingOnly).not.toContain('*Cloth*');
    expect(stitchingOnly).not.toContain('Discount');
  });
});
