import {
  formatRupees,
  paiseToInput,
  paiseToSignedInput,
  parseRupees,
  parseSignedRupees,
} from './money';

describe('parseRupees', () => {
  it.each([
    ['450', 45000],
    ['450.5', 45050],
    ['450.55', 45055],
    ['450.', 45000],
    ['.5', 50],
    [' 120 ', 12000],
    ['0', 0],
    // 1.15 * 100 is 114.99999… in floating point; rounding keeps it exact.
    ['1.15', 115],
  ])('reads "%s" as %i paise', (text, paise) => {
    expect(parseRupees(text)).toBe(paise);
  });

  it.each(['', '  ', 'abc', '-5', '4,500', '450.555', '12345678', '1e3', '.'])(
    'rejects "%s"',
    (text) => {
      expect(parseRupees(text)).toBeNull();
    }
  );
});

describe('paiseToInput', () => {
  it('drops paise when there are none', () => {
    expect(paiseToInput(45000)).toBe('450');
  });

  it('keeps two digits of paise', () => {
    expect(paiseToInput(45005)).toBe('450.05');
    expect(paiseToInput(45050)).toBe('450.50');
  });

  it('round-trips through parseRupees', () => {
    for (const paise of [0, 5, 99, 100, 45050, 9999999]) {
      expect(parseRupees(paiseToInput(paise))).toBe(paise);
    }
  });
});

describe('formatRupees', () => {
  it.each([
    [0, '₹0'],
    [45000, '₹450'],
    [45050, '₹450.50'],
    [123400, '₹1,234'],
    [12345600, '₹1,23,456'],
    [1234567800, '₹1,23,45,678'],
    [-5000, '-₹50'],
  ])('formats %i paise as %s', (paise, text) => {
    expect(formatRupees(paise)).toBe(text);
  });
});

describe('parseSignedRupees', () => {
  it('reads an amount, with or without a plus-minus sign', () => {
    expect(parseSignedRupees('200')).toBe(20000);
    expect(parseSignedRupees('-200')).toBe(-20000);
    expect(parseSignedRupees('−200')).toBe(-20000);
    expect(parseSignedRupees(' -2.5 ')).toBe(-250);
  });

  it('reads a minus zero as zero, never as -0', () => {
    expect(Object.is(parseSignedRupees('-0'), 0)).toBe(true);
  });

  it('is null for what is not an amount', () => {
    expect(parseSignedRupees('')).toBeNull();
    expect(parseSignedRupees('-')).toBeNull();
    expect(parseSignedRupees('--5')).toBeNull();
    expect(parseSignedRupees('abc')).toBeNull();
  });
});

describe('paiseToSignedInput', () => {
  it('writes a reduction as the field would take it back', () => {
    expect(paiseToSignedInput(-20000)).toBe('-200');
    expect(paiseToSignedInput(-250)).toBe('-2.50');
    expect(paiseToSignedInput(10000)).toBe('100');
    expect(parseSignedRupees(paiseToSignedInput(-250))).toBe(-250);
  });
});
