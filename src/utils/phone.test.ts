import { formatMobile, messagingNumber } from './phone';

describe('messagingNumber', () => {
  it('adds the country code to a ten-digit mobile', () => {
    expect(messagingNumber('9876543210')).toBe('919876543210');
  });

  it('reads through spaces, dashes and a leading 0, +91 or 91', () => {
    expect(messagingNumber('98765 43210')).toBe('919876543210');
    expect(messagingNumber('98765-43210')).toBe('919876543210');
    expect(messagingNumber('09876543210')).toBe('919876543210');
    expect(messagingNumber('+91 98765 43210')).toBe('919876543210');
    expect(messagingNumber('919876543210')).toBe('919876543210');
  });

  it('is null for no number, or one that is not a mobile', () => {
    expect(messagingNumber(null)).toBeNull();
    expect(messagingNumber('')).toBeNull();
    expect(messagingNumber('98765')).toBeNull();
    expect(messagingNumber('98765432101234')).toBeNull();
  });
});

describe('formatMobile', () => {
  it('splits ten digits into two fives', () => {
    expect(formatMobile('9876543210')).toBe('98765 43210');
  });

  it('leaves anything else as it was', () => {
    expect(formatMobile('12345')).toBe('12345');
  });
});
