import { readExtra } from './extraAmount';

describe('readExtra', () => {
  it('reads an extra, and none as blank', () => {
    expect(readExtra('100', 120000)).toEqual({ ok: true, paise: 10000 });
    expect(readExtra('  ', 120000)).toEqual({ ok: true, paise: 0 });
  });

  it('reads a minus as a reduction: Royal Armani at 1,000 where Armani is 1,200', () => {
    expect(readExtra('-200', 120000)).toEqual({ ok: true, paise: -20000 });
    expect(readExtra('−200', 120000)).toEqual({ ok: true, paise: -20000 });
    expect(readExtra('-2.5', 120000)).toEqual({ ok: true, paise: -250 });
  });

  it('is no reduction at all for a minus zero', () => {
    expect(readExtra('-0', 120000)).toEqual({ ok: true, paise: 0 });
  });

  it('refuses what is not an amount', () => {
    expect(readExtra('abc', 120000)).toEqual({
      ok: false,
      error: 'Enter an amount like 100',
    });
    expect(readExtra('--5', 120000)).toMatchObject({ ok: false });
  });

  it('refuses a reduction that takes the rate to nothing or below', () => {
    const error = "Take off less than ₹1,200, the cloth's price";
    expect(readExtra('-1200', 120000)).toEqual({ ok: false, error });
    expect(readExtra('-1500', 120000)).toEqual({ ok: false, error });
    expect(readExtra('-1199', 120000)).toEqual({ ok: true, paise: -119900 });
  });
});
