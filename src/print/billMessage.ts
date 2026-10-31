import { Platform } from 'react-native';
import type { Bill } from '../repositories/billRepo';
import { messagingNumber } from '../utils/phone';
import { buildBillText } from './billText';

// The bill as a message to the customer's own number: a link that opens
// WhatsApp (or the SMS app) on that chat with the bill already written in it,
// so the tailor only presses send.

export type MessageChannel = 'whatsapp' | 'sms';

/**
 * The link that opens `channel` on a chat with `phone` (country code and
 * digits) with `text` ready to send.
 */
export function messageUrl(
  channel: MessageChannel,
  phone: string,
  text: string,
  platform: string = Platform.OS
): string {
  const body = encodeURIComponent(text);
  if (channel === 'whatsapp') return `https://wa.me/${phone}?text=${body}`;
  // iOS takes the body after "&", Android after "?".
  return `sms:+${phone}${platform === 'ios' ? '&' : '?'}body=${body}`;
}

/**
 * The link that sends this bill to the number on it, or null when the bill
 * has no usable mobile number.
 */
export function billMessageUrl(
  bill: Bill,
  channel: MessageChannel
): string | null {
  const phone = messagingNumber(bill.customerMobile);
  return phone ? messageUrl(channel, phone, buildBillText(bill)) : null;
}
