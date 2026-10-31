import {
  clothLineName,
  pendingPaise,
  type Bill,
} from '../repositories/billRepo';
import { formatMeters } from '../utils/billMath';
import { clothLineHindi } from '../utils/clothHindi';
import { formatDate } from '../utils/dates';
import { formatDt } from '../utils/dtNumber';
import { formatRupees } from '../utils/money';
import { SHOP } from './shop';

/**
 * The bill as a plain message, for WhatsApp, SMS or anywhere text goes.
 * `*word*` is bold in WhatsApp and harmless elsewhere. The rate shown is the
 * one charged, like the printed bill — never the catalog price plus extra.
 */
export function buildBillText(bill: Bill): string {
  const pending = pendingPaise(bill);
  const customer = bill.customerName.trim();
  const lines: string[] = [
    `*${SHOP.name}*`,
    `Bill No. ${bill.id} · ${formatDate(bill.createdAt)}`,
    ...(bill.dtNumber ? [formatDt(bill.dtNumber)] : []),
  ];
  // The name is optional, so a bill may not have one to print.
  if (customer) lines.push('', `Customer: ${customer}`);

  if (bill.cloths.length) {
    lines.push('', '*Cloth*');
    for (const cloth of bill.cloths) {
      const hindi = clothLineHindi(
        cloth.clothName,
        cloth.clothNameHindi,
        cloth.variant
      );
      lines.push(
        clothLineName(cloth),
        ...(hindi ? [hindi] : []),
        `${formatMeters(cloth.lengthCm)} × ${formatRupees(cloth.pricePerMeterPaise)} = ${formatRupees(cloth.amountPaise)}`
      );
    }
  }

  if (bill.garments.length) {
    lines.push('', '*Stitching*');
    for (const garment of bill.garments) {
      lines.push(
        garment.name,
        `${garment.quantity} × ${formatRupees(garment.makingPaise)} = ${formatRupees(garment.amountPaise)}`
      );
    }
  }

  lines.push('');
  if (bill.clothPaise) lines.push(`Cloth: ${formatRupees(bill.clothPaise)}`);
  if (bill.makingPaise) lines.push(`Making: ${formatRupees(bill.makingPaise)}`);
  if (bill.discountPaise) {
    lines.push(`Discount: -${formatRupees(bill.discountPaise)}`);
  }
  lines.push(`*Total: ${formatRupees(bill.totalPaise)}*`);
  if (bill.paidPaise) lines.push(`Paid: ${formatRupees(bill.paidPaise)}`);
  lines.push(
    pending > 0
      ? `*Balance due: ${formatRupees(pending)}*`
      : '*Paid in full. Thank you!*'
  );

  lines.push(
    '',
    `Thank you for choosing ${SHOP.name}`,
    SHOP.address,
    SHOP.contacts.map((c) => `${c.label} ${c.phone}`).join(' · ')
  );
  return lines.join('\n');
}
