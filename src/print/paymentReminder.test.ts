import {
  buildPaymentReminder,
  dialUrl,
  paymentReminderUrl,
} from './paymentReminder';

const bill = {
  id: 8,
  customerName: 'Imran Shaikh',
  customerMobile: '98765 43210',
  totalPaise: 500000,
  paidPaise: 150000,
};

describe('buildPaymentReminder', () => {
  const text = buildPaymentReminder(bill);

  it('says what is still due on which bill, in English and Hindi', () => {
    expect(text).toContain('Dear Imran Shaikh,');
    expect(text).toContain('Your bill *No. 8* has a balance of *₹3,500*.');
    expect(text).toContain('प्रिय Imran Shaikh,');
    expect(text).toContain('आपके बिल *नंबर 8* के *₹3,500* बाकी हैं।');
  });

  it('names the DT number with the bill, where there is one', () => {
    const text2 = buildPaymentReminder({ ...bill, dtNumber: 'A-1' });
    expect(text2).toContain('Your bill *No. 8 · DT A-1*');
    expect(text2).toContain('आपके बिल *नंबर 8 · DT A-1*');
  });

  it('is a reminder, not a demand: it allows it may be paid already', () => {
    expect(text).toContain('If you have already paid');
    expect(text).toContain('यदि भुगतान हो चुका है');
  });

  it('says how to pay and who to call', () => {
    expect(text).toContain('UPI: 9665718519junned@axl');
    expect(text).toContain('Decent Tailor · 96656 67219');
  });

  it('greets a customer with no name on the bill', () => {
    const noName = buildPaymentReminder({ ...bill, customerName: '  ' });
    expect(noName).toContain('Dear Customer,');
    expect(noName).toContain('प्रिय ग्राहक,');
  });

  it('keeps a name from switching WhatsApp formatting on', () => {
    expect(
      buildPaymentReminder({ ...bill, customerName: '*Imran_ ~S`' })
    ).toContain('Dear Imran S,');
  });
});

describe('paymentReminderUrl', () => {
  it('opens WhatsApp on the number on the bill, the reminder written in', () => {
    const url = paymentReminderUrl(bill);
    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(decodeURIComponent(url!.split('text=')[1])).toBe(
      buildPaymentReminder(bill)
    );
  });

  it('is null without a usable number', () => {
    expect(paymentReminderUrl({ ...bill, customerMobile: null })).toBeNull();
    expect(paymentReminderUrl({ ...bill, customerMobile: '123' })).toBeNull();
  });
});

describe('dialUrl', () => {
  it('dials the digits of the number', () => {
    expect(dialUrl('98765 43210')).toBe('tel:9876543210');
  });

  it('is null without a number', () => {
    expect(dialUrl(null)).toBeNull();
    expect(dialUrl('  ')).toBeNull();
  });
});
