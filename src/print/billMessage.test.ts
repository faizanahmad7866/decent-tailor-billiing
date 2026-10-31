import type { Bill } from '../repositories/billRepo';
import { billMessageUrl, messageUrl } from './billMessage';

const bill = {
  id: 8,
  customerName: 'Imran Shaikh',
  customerMobile: '98765 43210',
  clothText: 'Armani',
  totalLengthCm: 250,
  totalPaise: 325000,
  paidPaise: 0,
  createdAt: new Date(2026, 9, 28, 15, 50).toISOString(),
  clothPaise: 325000,
  makingPaise: 0,
  discountPaise: 0,
  cloths: [],
  garments: [],
  payments: [],
} as unknown as Bill;

describe('messageUrl', () => {
  it('opens WhatsApp on a chat with that number, text ready', () => {
    expect(messageUrl('whatsapp', '919876543210', 'Bill 8\n₹100')).toBe(
      'https://wa.me/919876543210?text=Bill%208%0A%E2%82%B9100'
    );
  });

  it('opens SMS to that number, with the body after ? on Android', () => {
    expect(messageUrl('sms', '919876543210', 'Hi there', 'android')).toBe(
      'sms:+919876543210?body=Hi%20there'
    );
  });

  it('puts the SMS body after & on iOS', () => {
    expect(messageUrl('sms', '919876543210', 'Hi', 'ios')).toBe(
      'sms:+919876543210&body=Hi'
    );
  });
});

describe('billMessageUrl', () => {
  it('goes to the number on the bill, with the bill written in it', () => {
    const url = billMessageUrl(bill, 'whatsapp') ?? '';
    expect(url.startsWith('https://wa.me/919876543210?text=')).toBe(true);
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(text).toContain('Bill No. 8');
    expect(text).toContain('Customer: Imran Shaikh');
  });

  it('is null when the bill has no number to send to', () => {
    expect(
      billMessageUrl({ ...bill, customerMobile: null }, 'whatsapp')
    ).toBeNull();
    expect(
      billMessageUrl({ ...bill, customerMobile: '123' }, 'sms')
    ).toBeNull();
  });
});
