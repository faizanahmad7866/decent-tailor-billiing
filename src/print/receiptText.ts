import {
  clothLineName,
  pendingPaise,
  type Bill,
} from '../repositories/billRepo';
import { formatMeters } from '../utils/billMath';
import { formatDate, formatTime } from '../utils/dates';
import { formatDt } from '../utils/dtNumber';
import { formatRupees } from '../utils/money';
import {
  charsFor,
  LINE_CHARS,
  printJob,
  qrBlock,
  textBlock,
  toPrinterText,
  type PrintBlock,
  type TextLine,
} from './escpos';
import { SHOP } from './shop';
import { upiPaymentLink } from './upiQr';

// The bill as a 58 mm till receipt in the printer's own font: 32 characters
// a line, amounts right-aligned, dashed rules between sections — the layout
// every receipt app prints. Every line is laid out here to its exact width,
// so the Print page's preview and the paper show the same characters in the
// same places. The printer's font has no Hindi, so cloth names print in
// English only.

export type ReceiptPart =
  { kind: 'line'; line: TextLine } | { kind: 'qr'; data: string };

const RULE = '-'.repeat(LINE_CHARS);

const rupees = (paise: number): string => toPrinterText(formatRupees(paise));

/** Words wrapped to `width` characters; a word longer than that is cut. */
export function wrap(text: string, width: number = LINE_CHARS): string[] {
  const lines: string[] = [];
  let current = '';
  for (let word of toPrinterText(text).trim().split(/\s+/)) {
    while (word.length > width) {
      if (current) lines.push(current);
      lines.push(word.slice(0, width));
      word = word.slice(width);
      current = '';
    }
    if (!word) continue;
    if (!current) current = word;
    else if (current.length + 1 + word.length <= width) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const center = (text: string, width: number): string =>
  ' '.repeat(Math.max(0, Math.floor((width - text.length) / 2))) + text;

/**
 * `label` on the left, `value` on the right of one line. A label too long
 * to share the line wraps above, and the value goes on a line of its own.
 */
export function row(label: string, value: string): string[] {
  const left = toPrinterText(label);
  const right = toPrinterText(value);
  if (left.length + 1 + right.length <= LINE_CHARS) {
    return [left + right.padStart(LINE_CHARS - left.length)];
  }
  return [...wrap(left), right.padStart(LINE_CHARS)];
}

/** The receipt for a bill, line by line, with the UPI QR while money is due. */
export function receiptParts(bill: Bill): ReceiptPart[] {
  const parts: ReceiptPart[] = [];
  const add = (texts: string[], style: Omit<TextLine, 'text'> = {}): void => {
    for (const text of texts) {
      parts.push({ kind: 'line', line: { ...style, text, align: 'left' } });
    }
  };
  const centered = (text: string, style: Omit<TextLine, 'text'> = {}) =>
    add(
      wrap(text, charsFor(style)).map((line) => center(line, charsFor(style))),
      style
    );

  // Shop
  centered(SHOP.name, { big: true, bold: true });
  centered(SHOP.tagline);
  centered(SHOP.address);
  for (const { label, phone } of SHOP.contacts) centered(`${label} ${phone}`);
  add([RULE]);

  // Bill and customer
  add(row(`Bill No. ${bill.id}`, formatDate(bill.createdAt)), { bold: true });
  if (bill.dtNumber) add([formatDt(bill.dtNumber)], { bold: true, tall: true });
  add(row('Time', formatTime(bill.createdAt)));
  const customer = bill.customerName.trim();
  if (customer) add(row('Customer', customer));
  if (bill.customerMobile) add(row('Mobile', bill.customerMobile));
  add([RULE]);

  // Lines: the name, then quantity × rate and the amount beneath it.
  if (bill.cloths.length) {
    add(['CLOTH'], { bold: true });
    for (const cloth of bill.cloths) {
      add(wrap(clothLineName(cloth)), { bold: true });
      add(
        row(
          `  ${formatMeters(cloth.lengthCm)} x ${rupees(cloth.pricePerMeterPaise)}`,
          rupees(cloth.amountPaise)
        )
      );
    }
  }
  if (bill.garments.length) {
    add(['STITCHING'], { bold: true });
    for (const garment of bill.garments) {
      add(wrap(garment.name));
      add(
        row(
          `  ${garment.quantity} x ${rupees(garment.makingPaise)}`,
          rupees(garment.amountPaise)
        )
      );
    }
  }
  add([RULE]);

  // Totals
  if (bill.clothPaise) add(row('Cloth', rupees(bill.clothPaise)));
  if (bill.makingPaise) add(row('Making', rupees(bill.makingPaise)));
  if (bill.discountPaise) {
    add(row('Discount', `-${rupees(bill.discountPaise)}`));
  }
  add(row('TOTAL', rupees(bill.totalPaise)), { bold: true, tall: true });
  if (bill.paidPaise) add(row('Paid', rupees(bill.paidPaise)));
  const due = pendingPaise(bill);
  if (due > 0) {
    add(row('BALANCE DUE', rupees(due)), { bold: true, tall: true });
  } else {
    centered('*** PAID IN FULL ***', { bold: true });
  }

  // Pay
  if (due > 0) {
    add([RULE]);
    centered(`Scan to pay ${rupees(due)}`, { bold: true });
    parts.push({ kind: 'qr', data: upiPaymentLink(due, `Bill ${bill.id}`) });
    centered('Any UPI app');
  }

  add([RULE]);
  centered('Thank you for choosing');
  centered(SHOP.name, { bold: true });
  return parts;
}

/**
 * The receipt as a print job: a block per line, so it goes out — and is
 * given time to print — evenly, a line at a time.
 */
export function receiptJob(parts: ReceiptPart[]): PrintBlock[] {
  return printJob(
    parts.map((part) =>
      part.kind === 'qr' ? qrBlock(part.data) : textBlock([part.line])
    )
  );
}
