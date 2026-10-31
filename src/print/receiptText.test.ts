import type { Bill } from '../repositories/billRepo';
import { LINE_CHARS } from './escpos';
import { receiptJob, receiptParts, row, wrap } from './receiptText';

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

const textOf = (parts: ReturnType<typeof receiptParts>): string[] =>
  parts.flatMap((part) => (part.kind === 'line' ? [part.line.text] : ['[QR]']));

describe('wrap', () => {
  it('breaks at words, and cuts a word longer than the line', () => {
    expect(wrap('Near Tawakkal Kirana, Lalkhadi Road, Amravati')).toEqual([
      'Near Tawakkal Kirana, Lalkhadi',
      'Road, Amravati',
    ]);
    expect(wrap('x'.repeat(40))).toEqual(['x'.repeat(32), 'x'.repeat(8)]);
  });
});

describe('row', () => {
  it('puts the value flush right on a full-width line', () => {
    const [line] = row('Cloth', 'Rs.3,250');
    expect(line).toHaveLength(LINE_CHARS);
    expect(line.startsWith('Cloth ')).toBe(true);
    expect(line.endsWith('Rs.3,250')).toBe(true);
  });

  it('gives a long label its own lines and the value one below', () => {
    const lines = row('Super Fine Italian Wool Suiting Blue', 'Rs.12,000');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe('Rs.12,000'.padStart(LINE_CHARS));
  });
});

describe('receiptParts', () => {
  const parts = receiptParts(bill);
  const text = textOf(parts);

  it('prints the DT number, large, where there is one', () => {
    expect(text.join('\n')).not.toContain('DT ');
    const withDt = receiptParts({ ...bill, dtNumber: 'A-1' });
    const line = withDt.find(
      (part) => part.kind === 'line' && part.line.text === 'DT A-1'
    );
    expect(line).toMatchObject({ line: { bold: true, tall: true } });
  });

  it('never runs a line past the paper', () => {
    for (const part of parts) {
      if (part.kind !== 'line') continue;
      const width = part.line.big ? LINE_CHARS / 2 : LINE_CHARS;
      expect(part.line.text.length).toBeLessThanOrEqual(width);
    }
  });

  it('has the shop, the bill and the customer', () => {
    expect(text[0].trim()).toBe('DECENT TAILOR');
    expect(text).toContainEqual(
      expect.stringMatching(/^Bill No\. 8 +28 Oct 2026$/)
    );
    expect(text).toContainEqual(
      expect.stringMatching(/^Customer +Imran Shaikh$/)
    );
  });

  it('prints each line as name, then quantity × rate and amount', () => {
    const at = text.indexOf('Armani - Royal Blue');
    expect(text[at + 1]).toMatch(/^ {2}2\.5 m x Rs\.1,300 +Rs\.3,250$/);
    const shirt = text.indexOf('Shirt');
    expect(text[shirt + 1]).toMatch(/^ {2}2 x Rs\.500 +Rs\.1,000$/);
  });

  it('prints the cloth names in bold, so they stand out on the roll', () => {
    const cloth = parts.find(
      (part) => part.kind === 'line' && part.line.text === 'Armani - Royal Blue'
    );
    expect(cloth && cloth.kind === 'line' && cloth.line.bold).toBe(true);
  });

  it('totals, then the balance due and a QR to pay it', () => {
    expect(text).toContainEqual(expect.stringMatching(/^Discount +-Rs\.200$/));
    expect(text).toContainEqual(expect.stringMatching(/^TOTAL +Rs\.4,050$/));
    expect(text).toContainEqual(
      expect.stringMatching(/^BALANCE DUE +Rs\.3,550$/)
    );
    const qr = parts.find((part) => part.kind === 'qr');
    expect(qr && qr.kind === 'qr' && qr.data).toContain('am=3550');
  });

  it('says paid in full, with no QR, once the bill is settled', () => {
    const paid = receiptParts({ ...bill, paidPaise: bill.totalPaise });
    expect(textOf(paid).some((line) => line.includes('PAID IN FULL'))).toBe(
      true
    );
    expect(paid.some((part) => part.kind === 'qr')).toBe(false);
  });

  it('leaves out the customer lines for a walk-in', () => {
    const walkIn = textOf(
      receiptParts({ ...bill, customerName: ' ', customerMobile: null })
    );
    expect(walkIn.some((line) => line.startsWith('Customer'))).toBe(false);
    expect(walkIn.some((line) => line.startsWith('Mobile'))).toBe(false);
  });
});

describe('receiptJob', () => {
  it('sends a block per line, and the QR as the printer’s own code', () => {
    const parts = receiptParts(bill);
    const job = receiptJob(parts);
    // Every part, plus the paper feed at the end.
    expect(job).toHaveLength(parts.length + 1);
  });
});
