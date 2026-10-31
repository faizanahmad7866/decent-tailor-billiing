import { spokenDiscount, spokenMeters } from './spokenText';

describe('spokenMeters', () => {
  it('says the meters', () => {
    expect(spokenMeters(500)).toBe('5 मीटर');
    expect(spokenMeters(250)).toBe('2.5 मीटर');
    expect(spokenMeters(225)).toBe('2.25 मीटर');
  });

  it('says nothing for no length', () => {
    expect(spokenMeters(0)).toBeNull();
    expect(spokenMeters(null)).toBeNull();
  });
});

describe('spokenDiscount', () => {
  it('says a percent discount, with the words as the counter says them', () => {
    expect(spokenDiscount({ kind: 'percent', percent: 10 })).toBe(
      '10 परसेंट डिस्काउंट'
    );
    expect(spokenDiscount({ kind: 'percent', percent: 12.5 })).toBe(
      '12.5 परसेंट डिस्काउंट'
    );
  });

  it('says an amount discount in rupees, and paise when there are some', () => {
    expect(spokenDiscount({ kind: 'amount', paise: 50000 })).toBe(
      '500 रुपये डिस्काउंट'
    );
    expect(spokenDiscount({ kind: 'amount', paise: 50050 })).toBe(
      '500 रुपये 50 पैसे डिस्काउंट'
    );
  });

  it('says nothing for no discount', () => {
    expect(spokenDiscount(null)).toBeNull();
    expect(spokenDiscount({ kind: 'percent', percent: 0 })).toBeNull();
    expect(spokenDiscount({ kind: 'amount', paise: 0 })).toBeNull();
  });
});
