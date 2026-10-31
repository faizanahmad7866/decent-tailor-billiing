import type { Bill } from '../repositories/billRepo';
import { buildBillHtml, escapeHtml } from './billHtml';

const bill: Bill = {
  id: 12,
  customerName: 'Imran <Shaikh>',
  customerMobile: '9876543210',
  dtNumber: null,
  clothText: 'Linen White',
  totalLengthCm: 250,
  totalPaise: 172500,
  paidPaise: 50000,
  createdAt: '2026-10-28T10:00:00Z',
  clothPaise: 112500,
  makingPaise: 80000,
  discountPaise: 20000,
  cloths: [
    {
      id: 1,
      clothId: 1,
      clothName: 'Linen White',
      clothNameHindi: null,
      imageName: null,
      variant: null,
      pricePerMeterPaise: 45000,
      extraPerMeterPaise: 0,
      lengthCm: 250,
      amountPaise: 112500,
    },
  ],
  garments: [
    {
      id: 1,
      name: 'Shirt',
      quantity: 2,
      makingPaise: 40000,
      amountPaise: 80000,
    },
  ],
  payments: [{ id: 1, amountPaise: 50000, createdAt: '2026-10-28T10:00:00Z' }],
};

describe('escapeHtml', () => {
  it('neutralises markup', () => {
    expect(escapeHtml(`<b>"A" & 'B'</b>`)).toBe(
      '&lt;b&gt;&quot;A&quot; &amp; &#39;B&#39;&lt;/b&gt;'
    );
  });
});

describe('buildBillHtml', () => {
  const html = buildBillHtml(bill, null);

  it('prints the DT number under the bill number, and nothing without one', () => {
    expect(html).not.toContain('DT ');
    expect(buildBillHtml({ ...bill, dtNumber: 'A-1' }, null)).toContain(
      '<div class="no">DT A-1</div>'
    );
    expect(buildBillHtml({ ...bill, dtNumber: '-1' }, null)).toContain(
      '<div class="no">DT-1</div>'
    );
  });

  it('escapes what the tailor typed', () => {
    expect(html).toContain('Imran &lt;Shaikh&gt;');
    expect(html).not.toContain('<Shaikh>');
  });

  it('prints every line and the balance still due', () => {
    expect(html).toContain('Linen White');
    expect(html).toContain('2.5 m');
    expect(html).toContain('Shirt');
    expect(html).toContain('-₹200');
    expect(html).toContain('Balance due');
    expect(html).toContain('₹1,225');
  });

  it('names the sub-type and prints only the rate charged', () => {
    const armani = buildBillHtml(
      {
        ...bill,
        cloths: [
          {
            ...bill.cloths[0],
            clothName: 'Armani',
            variant: 'Royal Blue',
            pricePerMeterPaise: 130000,
            extraPerMeterPaise: 10000,
          },
        ],
      },
      null
    );
    expect(armani).toContain('Armani — Royal Blue');
    expect(armani).toContain('₹1,300');
    expect(armani).not.toContain('₹1,200');
    expect(armani).not.toContain('₹100<');
  });

  it('prints the pay QR with the balance while money is due', () => {
    const withQr = buildBillHtml(bill, null, 'data:image/svg+xml;qr');
    expect(withQr).toContain('Scan to pay');
    expect(withQr).toContain('src="data:image/svg+xml;qr"');
    expect(withQr).toContain('₹1,225');
  });

  it('prints no QR when the bill is settled or no code was made', () => {
    expect(buildBillHtml(bill, null, null)).not.toContain('Scan to pay');
    const settled = buildBillHtml(
      { ...bill, paidPaise: bill.totalPaise },
      null,
      'data:image/svg+xml;qr'
    );
    expect(settled).not.toContain('Scan to pay');
  });

  it('leaves out "Billed to" when there is neither a name nor a mobile', () => {
    const none = buildBillHtml(
      { ...bill, customerName: '', customerMobile: null },
      null
    );
    expect(none).not.toContain('Billed to');
    expect(none).toContain('Linen White');
  });

  it('prints just the mobile when there is no name', () => {
    const mobileOnly = buildBillHtml({ ...bill, customerName: '' }, null);
    const who = /<div class="customer">(.*?)<\/div>/s.exec(mobileOnly)?.[1];
    expect(who?.replace(/<[^>]+>/g, '').trim()).toBe('9876543210');
  });

  it("prints the cloth's Hindi name under its English one", () => {
    expect(buildBillHtml(bill, null)).toContain(
      '<div class="hi">लिनन व्हाइट</div>'
    );
  });

  it('prefers the Hindi saved on the bill', () => {
    const saved = buildBillHtml(
      { ...bill, cloths: [{ ...bill.cloths[0], clothNameHindi: 'लिनेन' }] },
      null
    );
    expect(saved).toContain('<div class="hi">लिनेन</div>');
    expect(saved).not.toContain('लिनन व्हाइट');
  });

  it('marks a fully paid bill as paid', () => {
    const paid = buildBillHtml({ ...bill, paidPaise: bill.totalPaise }, null);
    expect(paid).toContain('PAID IN FULL');
    expect(paid).not.toContain('Balance due');
  });
});
