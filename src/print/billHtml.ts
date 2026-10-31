import {
  clothLineName,
  pendingPaise,
  type Bill,
} from '../repositories/billRepo';
import { formatMeters } from '../utils/billMath';
import { clothLineHindi } from '../utils/clothHindi';
import { formatDateTime } from '../utils/dates';
import { formatDt } from '../utils/dtNumber';
import { formatRupees } from '../utils/money';
import { SHOP } from './shop';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Laid out to the full width of whatever paper the printer takes — A4,
// Letter or a roll — rather than a fixed size, which left the bill small in
// one corner of the page. Ink on white with gold only for hairlines: the
// shop's printer is black and white, and a bill has to read just as well
// there.
const STYLES = `
  @page { margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: #1D1C1A;
  }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .muted { color: #6E685F; }

  .head { display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { height: 64px; }
  .shop { margin-top: 6px; line-height: 1.5; }
  .bill-id { text-align: right; }
  .bill-id h1 { margin: 0; font-size: 22px; letter-spacing: 3px; }
  .bill-id .no { font-size: 15px; font-weight: 700; margin-top: 4px; }

  .rule { border: 0; border-top: 1.5px solid #C69B47; margin: 14px 0; }

  .label {
    font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
    text-transform: uppercase; color: #6E685F;
  }
  .hi { font-size: 13px; margin-top: 1px; }
  .customer { font-size: 16px; font-weight: 700; margin-top: 3px; }

  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  th {
    font-size: 10px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: #6E685F; text-align: left;
    padding: 0 0 6px; border-bottom: 1px solid #1D1C1A;
  }
  td { padding: 9px 0; border-bottom: 1px solid #E6E1D8; }
  th + th, td + td { padding-left: 8px; }

  .summary { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-top: 18px; }
  .totals { margin-left: auto; width: 55%; }
  .pay { width: 36%; text-align: center; }
  .pay img { display: block; width: 100%; max-width: 150px; margin: 0 auto; }
  .pay .scan { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 6px; }
  .pay .amount { font-size: 15px; font-weight: 800; margin-top: 6px; }
  .pay .upi { font-size: 10px; color: #6E685F; margin-top: 2px; }
  .totals .row { display: flex; justify-content: space-between; padding: 3px 0; }
  .totals .grand {
    font-size: 18px; font-weight: 800;
    border-top: 1px solid #1D1C1A; margin-top: 4px; padding-top: 8px;
  }
  .due {
    display: flex; justify-content: space-between; margin-top: 8px;
    padding: 9px 12px; border: 1.5px solid #1D1C1A; font-weight: 800;
    font-size: 15px;
  }
  .paid-stamp { margin-top: 8px; text-align: right; font-weight: 800; letter-spacing: 2px; }

  .foot { margin-top: 28px; text-align: center; }
  .foot .thanks { font-size: 14px; font-weight: 700; }
`;

const row = (label: string, value: string, className = 'row'): string =>
  `<div class="${className}"><span>${label}</span><span class="num">${value}</span></div>`;

/** A cloth's Hindi name under its English one, when it has one to show. */
function hindiLine(cloth: Bill['cloths'][number]): string {
  const hindi = clothLineHindi(
    cloth.clothName,
    cloth.clothNameHindi,
    cloth.variant
  );
  return hindi ? `<div class="hi">${escapeHtml(hindi)}</div>` : '';
}

/** Who the bill is for. Name and mobile are both optional: with neither,
 *  the block is left out rather than printing an empty "Billed to". */
function billedTo(bill: Bill): string {
  const name = bill.customerName.trim();
  const mobile = bill.customerMobile?.trim();
  if (!name && !mobile) return '';
  const who = [
    name ? escapeHtml(name) : '',
    mobile
      ? `<span class="${name ? 'muted' : ''}">${name ? '· ' : ''}${escapeHtml(mobile)}</span>`
      : '',
  ].join(' ');
  return `<div class="label">Billed to</div>\n  <div class="customer">${who}</div>`;
}

/** The customer's bill as a complete HTML page, ready for expo-print. */
export function buildBillHtml(
  bill: Bill,
  logoDataUri: string | null,
  paymentQrDataUri: string | null = null
): string {
  const pending = pendingPaise(bill);

  const clothRows = bill.cloths
    .map(
      (cloth) => `<tr>
        <td>${escapeHtml(clothLineName(cloth))}${hindiLine(cloth)}</td>
        <td class="num">${formatMeters(cloth.lengthCm)}</td>
        <td class="num">${formatRupees(cloth.pricePerMeterPaise)}</td>
        <td class="num">${formatRupees(cloth.amountPaise)}</td>
      </tr>`
    )
    .join('');

  const garmentRows = bill.garments
    .map(
      (garment) => `<tr>
        <td>${escapeHtml(garment.name)}</td>
        <td class="num">${garment.quantity}</td>
        <td class="num">${formatRupees(garment.makingPaise)}</td>
        <td class="num">${formatRupees(garment.amountPaise)}</td>
      </tr>`
    )
    .join('');

  const contacts = SHOP.contacts
    .map((contact) => `${contact.label} ${contact.phone}`)
    .join(' · ');

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>${STYLES}</style></head>
<body>
  <div class="head">
    <div>
      ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="${SHOP.name}">` : `<h2>${SHOP.name}</h2>`}
      <div class="shop muted">${escapeHtml(SHOP.address)}<br>${contacts}</div>
    </div>
    <div class="bill-id">
      <h1>BILL</h1>
      <div class="no">No. ${bill.id}</div>
      ${bill.dtNumber ? `<div class="no">${escapeHtml(formatDt(bill.dtNumber))}</div>` : ''}
      <div class="muted">${formatDateTime(bill.createdAt)}</div>
    </div>
  </div>

  <hr class="rule">

  ${billedTo(bill)}

  ${
    clothRows
      ? `<table>
    <tr><th>Cloth</th><th class="num">Meters</th><th class="num">Rate / m</th><th class="num">Amount</th></tr>
    ${clothRows}
  </table>`
      : ''
  }

  ${
    garmentRows
      ? `<table>
    <tr><th>Stitching</th><th class="num">Qty</th><th class="num">Making</th><th class="num">Amount</th></tr>
    ${garmentRows}
  </table>`
      : ''
  }

  <div class="summary">
  ${
    // Only while money is left to pay, and only if a code could be made.
    paymentQrDataUri && pending > 0
      ? `<div class="pay">
    <div class="scan">Scan to pay</div>
    <img src="${paymentQrDataUri}" alt="UPI payment QR">
    <div class="amount">${formatRupees(pending)}</div>
    <div class="upi">Any UPI app</div>
  </div>`
      : ''
  }
  <div class="totals">
    ${bill.clothPaise ? row('Cloth', formatRupees(bill.clothPaise)) : ''}
    ${bill.makingPaise ? row('Making', formatRupees(bill.makingPaise)) : ''}
    ${bill.discountPaise ? row('Discount', `-${formatRupees(bill.discountPaise)}`) : ''}
    ${row('Total', formatRupees(bill.totalPaise), 'row grand')}
    ${bill.paidPaise ? row('Paid', formatRupees(bill.paidPaise)) : ''}
    ${
      pending > 0
        ? `<div class="due"><span>Balance due</span><span class="num">${formatRupees(pending)}</span></div>`
        : '<div class="paid-stamp">PAID IN FULL</div>'
    }
  </div>
  </div>

  <div class="foot">
    <div class="thanks">Thank you for choosing ${SHOP.name}</div>
    <div class="muted">${SHOP.tagline}</div>
  </div>
</body></html>`;
}
