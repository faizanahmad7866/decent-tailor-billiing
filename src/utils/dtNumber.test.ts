import { formatDt, normalizeDtValue, sanitizeDtInput } from './dtNumber';

describe('sanitizeDtInput', () => {
  it('capitalises and keeps what a tag can carry', () => {
    expect(sanitizeDtInput('a-1')).toBe('A-1');
    expect(sanitizeDtInput('b/2.5 x')).toBe('B/2.5 X');
  });

  it('drops what the printer cannot print', () => {
    expect(sanitizeDtInput('डीटी1#@')).toBe('1');
  });

  it('stops at the longest a value may be', () => {
    expect(sanitizeDtInput('1234567890123456')).toBe('123456789012');
  });
});

describe('normalizeDtValue', () => {
  it('keeps the value as written, tidied', () => {
    expect(normalizeDtValue(' 1 ')).toBe('1');
    expect(normalizeDtValue('a-1')).toBe('A-1');
    expect(normalizeDtValue('-1')).toBe('-1');
    expect(normalizeDtValue('A   1')).toBe('A 1');
  });

  it('is nothing for a blank box', () => {
    expect(normalizeDtValue('   ')).toBeNull();
  });

  it('does not double a DT typed into the box', () => {
    expect(normalizeDtValue('DT-5')).toBe('-5');
    expect(normalizeDtValue('dt 5')).toBe('5');
    expect(normalizeDtValue('DT5')).toBe('5');
    expect(normalizeDtValue('DT')).toBeNull();
  });

  it('leaves a word that only begins with those letters', () => {
    expect(normalizeDtValue('DTX1')).toBe('DTX1');
  });
});

describe('formatDt', () => {
  it('sets the value after DT', () => {
    expect(formatDt('1')).toBe('DT 1');
    expect(formatDt('A-1')).toBe('DT A-1');
  });

  it('runs a value with its own dash straight on, as the main app writes it', () => {
    expect(formatDt('-1')).toBe('DT-1');
    expect(formatDt('-A1')).toBe('DT-A1');
  });
});
