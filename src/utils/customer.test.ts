import { billTitle, customerLabel, WALK_IN } from './customer';

describe('customerLabel', () => {
  it('is the name when there is one', () => {
    expect(customerLabel('Imran Shaikh')).toBe('Imran Shaikh');
  });

  it('is "Walk-in customer" for a missing or blank name', () => {
    expect(customerLabel('')).toBe(WALK_IN);
    expect(customerLabel('   ')).toBe(WALK_IN);
  });
});

describe('billTitle', () => {
  it('joins the bill number and the name', () => {
    expect(billTitle({ id: 8, customerName: 'Imran' })).toBe('Bill 8 — Imran');
  });

  it('is just the number when there is no name', () => {
    expect(billTitle({ id: 8, customerName: '' })).toBe('Bill 8');
  });
});
