import {
  METER_LIMITS,
  RUPEE_LIMITS,
  sanitizeDecimal,
  sanitizeDigits,
} from './inputFilters';
import { parseMeters } from './billMath';
import { parseRupees } from './money';

const METERS = METER_LIMITS;
const RUPEES = RUPEE_LIMITS;

describe('sanitizeDecimal', () => {
  it('leaves a valid number alone', () => {
    expect(sanitizeDecimal('2.5', METERS)).toBe('2.5');
    expect(sanitizeDecimal('450', RUPEES)).toBe('450');
  });

  it('turns a comma into the point', () => {
    expect(sanitizeDecimal('2,5', METERS)).toBe('2.5');
  });

  it('drops anything that is not a digit or a point', () => {
    expect(sanitizeDecimal('₹1a2 0-0', RUPEES)).toBe('1200');
  });

  it('keeps only the first point', () => {
    expect(sanitizeDecimal('1.2.3', METERS)).toBe('1.23');
  });

  it('cuts digits past the limits', () => {
    expect(sanitizeDecimal('1234', METERS)).toBe('123');
    expect(sanitizeDecimal('2.555', METERS)).toBe('2.55');
  });

  it('allows a point typed first or last, as a number is typed', () => {
    expect(sanitizeDecimal('.', METERS)).toBe('.');
    expect(sanitizeDecimal('.5', METERS)).toBe('.5');
    expect(sanitizeDecimal('2.', METERS)).toBe('2.');
  });

  it('gives empty for empty', () => {
    expect(sanitizeDecimal('', METERS)).toBe('');
  });

  it('only ever lets through what the form can read back', () => {
    for (const typed of ['2,5', '12', '0.75', '999.99', '.5']) {
      expect(parseMeters(sanitizeDecimal(typed, METERS))).not.toBeNull();
    }
    for (const typed of ['450', '450.5', '1,200', '.5']) {
      expect(parseRupees(sanitizeDecimal(typed, RUPEES))).not.toBeNull();
    }
  });
});

describe('sanitizeDigits', () => {
  it('keeps digits only, up to the limit', () => {
    expect(sanitizeDigits('98765 43210', 10)).toBe('9876543210');
    expect(sanitizeDigits('+91 98765432101234', 10)).toBe('9198765432');
  });
});
