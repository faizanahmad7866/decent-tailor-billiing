import { billPaymentQr, qrSvgPath, SHOP_UPI, upiPaymentLink } from './upiQr';

describe('upiPaymentLink', () => {
  const link = upiPaymentLink(123450, 'Bill 8');
  const query = new URLSearchParams(link.slice(link.indexOf('?') + 1));

  it('is a standard upi://pay link', () => {
    expect(link.startsWith('upi://pay?')).toBe(true);
  });

  it("carries the shop's own payee, unchanged", () => {
    expect(query.get('pa')).toBe(SHOP_UPI.payeeAddress);
    expect(query.get('pn')).toBe(SHOP_UPI.payeeName);
    expect(query.get('mc')).toBe('0000');
  });

  it('writes the amount in rupees with two decimals', () => {
    expect(query.get('am')).toBe('1234.50');
    expect(query.get('cu')).toBe('INR');
    expect(
      new URLSearchParams(upiPaymentLink(5, 'x').split('?')[1]).get('am')
    ).toBe('0.05');
    expect(
      new URLSearchParams(upiPaymentLink(100000, 'x').split('?')[1]).get('am')
    ).toBe('1000.00');
  });

  it('keeps the @ of the UPI id readable', () => {
    expect(link).toContain(`pa=${SHOP_UPI.payeeAddress}`);
    expect(link).not.toContain('%40');
  });

  it('keeps only characters every UPI app reads in the note', () => {
    const noted = upiPaymentLink(100, 'Bill #8 — Imran & Co');
    expect(new URLSearchParams(noted.split('?')[1]).get('tn')).toBe(
      'Bill 8  Imran  Co'
    );
  });
});

describe('qr drawing', () => {
  it('draws a square code with a quiet zone', () => {
    const { size, path } = qrSvgPath('hello');
    expect(size).toBeGreaterThan(8);
    expect(path.startsWith('M')).toBe(true);
  });

  it('gives an svg data uri for a bill', () => {
    const uri = billPaymentQr(355000, 8);
    expect(uri.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(uri)).toContain('viewBox');
  });
});
