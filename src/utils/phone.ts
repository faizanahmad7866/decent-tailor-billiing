// A customer's mobile number as the bill holds it (ten digits, as typed) and
// as a message app needs it. The shop is in India, so +91 is assumed.

const COUNTRY_CODE = '91';

/**
 * The number with its country code and nothing else — "919876543210" — for
 * WhatsApp and SMS to reach that very number; null when the bill has none or
 * it isn't a mobile number.
 */
export function messagingNumber(mobile: string | null): string | null {
  const digits = (mobile ?? '').replace(/\D/g, '');
  // Typed with a leading 0 or the country code: the ten digits are what count.
  const local = digits.replace(/^(?:0|91)(?=\d{10}$)/, '');
  return /^\d{10}$/.test(local) ? COUNTRY_CODE + local : null;
}

/** "98765 43210", the way a number is easiest to read back. */
export function formatMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  return digits.length === 10
    ? `${digits.slice(0, 5)} ${digits.slice(5)}`
    : mobile;
}
