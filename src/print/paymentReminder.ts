import { pendingPaise, type BillSummary } from '../repositories/billRepo';
import { formatDt } from '../utils/dtNumber';
import { formatRupees } from '../utils/money';
import { formatMobile, messagingNumber } from '../utils/phone';
import { messageUrl } from './billMessage';
import { titleCase } from './designShareText';
import { SHOP } from './shop';
import { SHOP_UPI } from './upiQr';

// The WhatsApp message that reminds a customer of what is still due: the same
// words as the main Decent Tailor app's, in English and then in Hindi. It says
// what is owed and how to pay, and allows that it may already be paid, so it
// reads as a reminder and never as a demand.

// WhatsApp reads these as bold, italic, strikethrough and monospace markers. A
// name that happens to contain one would switch formatting on mid-message.
const WHATSAPP_MARKERS = /[*_~`]/g;

type ReminderBill = Pick<
  BillSummary,
  'id' | 'customerName' | 'customerMobile' | 'totalPaise' | 'paidPaise'
> &
  Partial<Pick<BillSummary, 'dtNumber'>>;

/** The reminder for a bill, ready to send. */
export function buildPaymentReminder(bill: ReminderBill): string {
  const name = bill.customerName.replace(WHATSAPP_MARKERS, '').trim();
  const amount = formatRupees(pendingPaise(bill));
  const [contact] = SHOP.contacts;
  const dt = bill.dtNumber ? ` · ${formatDt(bill.dtNumber)}` : '';
  return [
    `*${SHOP.name}*`,
    'Payment reminder',
    '',
    name ? `Dear ${name},` : 'Dear Customer,',
    `Your bill *No. ${bill.id}${dt}* has a balance of *${amount}*.`,
    'Kindly pay at the shop or by UPI at your convenience.',
    'If you have already paid, please ignore this message.',
    '',
    name ? `प्रिय ${name},` : 'प्रिय ग्राहक,',
    `आपके बिल *नंबर ${bill.id}${dt}* के *${amount}* बाकी हैं।`,
    'कृपया अपनी सुविधा अनुसार दुकान पर या UPI से भुगतान करें।',
    'यदि भुगतान हो चुका है, तो इस संदेश को अनदेखा करें।',
    '',
    `UPI: ${SHOP_UPI.payeeAddress}`,
    '',
    'Thank you · धन्यवाद',
    `${titleCase(SHOP.name)} · ${formatMobile(contact.phone)}`,
  ].join('\n');
}

/**
 * The link that opens WhatsApp on the customer's chat with the reminder written
 * in it, for the tailor to press send; null when the bill has no mobile number.
 */
export function paymentReminderUrl(bill: ReminderBill): string | null {
  const phone = messagingNumber(bill.customerMobile);
  return phone
    ? messageUrl('whatsapp', phone, buildPaymentReminder(bill))
    : null;
}

/** The link that dials a customer; null when the bill has no mobile number. */
export function dialUrl(mobile: string | null): string | null {
  const digits = (mobile ?? '').replace(/\D/g, '');
  return digits ? `tel:${digits}` : null;
}
