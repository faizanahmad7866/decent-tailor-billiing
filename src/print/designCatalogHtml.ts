import { clothLineName } from '../repositories/billRepo';
import type { PatternItem } from '../repositories/patternRepo';
import { formatMeters, totalLengthCm } from '../utils/billMath';
import { clothLineHindi } from '../utils/clothHindi';
import { formatDate } from '../utils/dates';
import { designHindi } from '../utils/designHindi';
import { noteHindi } from '../utils/noteHindi';
import { formatRupees } from '../utils/money';
import { designPriceText } from '../utils/patternPricing';
import { formatMobile } from '../utils/phone';
import { escapeHtml } from './billHtml';
import { SHOP } from './shop';

// A design as the shop hands it to a customer: a document they open on WhatsApp
// and keep, from the same family as the shop's bill. A letterhead, the design's
// name and price, its photo large on white; then every other photo, the cloth
// and stitching as a table with ruled totals, and how to reach the shop. Dark
// neutral type and hairlines, with the logo the only colour on the page: it
// should read as a tailor's quotation, not a poster.

/** Everything the catalogue shows that is not on the design itself. */
export interface DesignCatalogAssets {
  /** The gold logo, as a data URI; the shop's name is set in its place without. */
  logo: string | null;
  /** The design's photos as data URIs, in order; the first is the cover. */
  photos: string[];
  /** A photo of each cloth, in the design's order; null where there is none. */
  clothPhotos: (string | null)[];
  /** A QR that opens a WhatsApp chat with the shop, as a data URI. */
  chatQr: string | null;
  /** The day the prices were read: they follow the catalog's rates. */
  date: Date;
}

const INK = '#1F2937';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const BAND = '#F3F4F6';

const STYLES = `
  @page { size: A4; margin: 14mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Roboto, 'Noto Sans', 'Noto Sans Devanagari', Helvetica, Arial, sans-serif;
    font-size: 10pt;
    color: ${INK};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .right { text-align: right; }
  .muted { color: ${MUTED}; }
  .block { break-inside: avoid; page-break-inside: avoid; }

  .letterhead {
    display: flex; justify-content: space-between; align-items: flex-end; gap: 10mm;
    padding-bottom: 4mm; border-bottom: 0.4mm solid ${INK};
  }
  .logo { height: 19mm; display: block; }
  .wordmark { font-size: 16pt; font-weight: 600; letter-spacing: 1px; }
  .shop { text-align: right; font-size: 8.5pt; line-height: 1.55; color: ${MUTED}; }

  .title { display: flex; justify-content: space-between; align-items: flex-start; gap: 10mm; margin-top: 6mm; }
  .title-main { flex: 1; min-width: 0; }
  .kind { font-size: 9pt; color: ${MUTED}; }
  .name { font-size: 19pt; font-weight: 600; line-height: 1.2; margin-top: 1mm; }
  .name-hi { font-size: 11.5pt; color: ${MUTED}; margin-top: 1mm; }
  .price { flex: none; text-align: right; }
  .price-label { font-size: 9pt; color: ${MUTED}; }
  .price-amount { font-size: 19pt; font-weight: 600; line-height: 1.2; margin-top: 1mm; }

  .photo {
    margin-top: 5mm; height: 186mm; border: 0.25mm solid ${BORDER};
    display: flex; align-items: center; justify-content: center; background: #fff;
  }
  .photo img { width: calc(100% - 8mm); height: calc(100% - 8mm); object-fit: contain; }

  .page { break-before: page; page-break-before: always; }
  .running {
    display: flex; justify-content: space-between; gap: 8mm; font-size: 8.5pt; color: ${MUTED};
    padding-bottom: 2.5mm; border-bottom: 0.25mm solid ${BORDER};
  }

  .part { margin-top: 7mm; }
  .heading { font-size: 11pt; font-weight: 600; margin-bottom: 2.5mm; }
  .heading .hi { font-weight: 400; font-size: 10pt; color: ${MUTED}; }

  .views { display: flex; gap: 4mm; }
  .views .photo { flex: 1; margin-top: 0; height: 80mm; }

  table { width: 100%; border-collapse: collapse; border: 0.25mm solid ${BORDER}; }
  th {
    font-size: 8.5pt; font-weight: 600; color: ${MUTED}; text-align: left;
    padding: 2mm 2.5mm; background: ${BAND}; border-bottom: 0.25mm solid ${BORDER};
  }
  td { padding: 2.2mm 2.5mm; border-bottom: 0.25mm solid ${BORDER}; vertical-align: middle; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th.right { text-align: right; }
  .cloth { display: flex; align-items: center; gap: 3mm; }
  .swatch { width: 11mm; height: 11mm; object-fit: cover; display: block; border: 0.25mm solid ${BORDER}; }
  .cloth-name { font-weight: 600; }
  .cloth-hi { font-size: 8.5pt; color: ${MUTED}; margin-top: 0.4mm; }

  .foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 10mm; margin-top: 4mm; }
  .needed { font-size: 9pt; color: ${MUTED}; line-height: 1.5; }
  .needed b { color: ${INK}; font-weight: 600; }
  .sum { width: 76mm; margin-left: auto; }
  .sum .row { display: flex; justify-content: space-between; padding: 1mm 0; color: ${MUTED}; }
  .sum .row .num { color: ${INK}; }
  .sum .total {
    display: flex; justify-content: space-between; margin-top: 1.5mm; padding: 2mm 0;
    border-top: 0.3mm solid ${INK}; border-bottom: 0.3mm solid ${INK};
    font-size: 12pt; font-weight: 600;
  }

  .design-note { padding: 3mm 3.5mm; border: 0.25mm solid ${BORDER}; line-height: 1.5; }
  .note-hi { color: ${MUTED}; margin-top: 1mm; }

  .contact {
    display: flex; justify-content: space-between; align-items: flex-start; gap: 10mm;
    padding-top: 4mm; border-top: 0.25mm solid ${BORDER};
  }
  .people { line-height: 1.65; }
  .people .who { display: inline-block; width: 16mm; color: ${MUTED}; }
  .address { color: ${MUTED}; margin-top: 1mm; }
  .chat { flex: none; display: flex; align-items: center; gap: 3mm; font-size: 8.5pt; color: ${MUTED}; line-height: 1.4; }
  .chat img { width: 24mm; height: 24mm; display: block; border: 0.25mm solid ${BORDER}; }

  .fine { margin-top: 4mm; font-size: 8pt; color: ${MUTED}; }
`;

/** The shop's mark: the logo, or its name set plainly where there is none. */
function mark(logo: string | null): string {
  return logo
    ? `<img class="logo" src="${logo}" alt="${escapeHtml(SHOP.name)}" />`
    : `<div class="wordmark">${escapeHtml(SHOP.name)}</div>`;
}

function letterhead(logo: string | null): string {
  const numbers = SHOP.contacts
    .map(({ label, phone }) => `${escapeHtml(label)} ${formatMobile(phone)}`)
    .join(' · ');
  return `
  <div class="letterhead">
    ${mark(logo)}
    <div class="shop">
      ${escapeHtml(SHOP.tagline)}<br />
      ${escapeHtml(SHOP.address)}<br />
      ${numbers}
    </div>
  </div>`;
}

function title(item: PatternItem): string {
  const hindi = designHindi(item.name);
  return `
  <div class="title">
    <div class="title-main">
      <div class="kind">${escapeHtml(item.categoryName)} · Design No. ${item.id}</div>
      <div class="name">${escapeHtml(item.name)}</div>
      ${hindi ? `<div class="name-hi">${escapeHtml(hindi)}</div>` : ''}
    </div>
    <div class="price">
      <div class="price-label">Price · कीमत</div>
      <div class="price-amount num">${designPriceText(item.pricePaise)}</div>
    </div>
  </div>`;
}

function picture(photo: string, name: string): string {
  return `<div class="photo"><img src="${photo}" alt="${escapeHtml(name)}" /></div>`;
}

function moreViews(item: PatternItem, photos: string[]): string {
  const rest = photos.slice(1);
  if (!rest.length) return '';
  return `
    <div class="part block">
      <div class="heading">More views <span class="hi">· और तस्वीरें</span></div>
      <div class="views">${rest.map((photo) => picture(photo, item.name)).join('')}</div>
    </div>`;
}

function clothTable(item: PatternItem, clothPhotos: (string | null)[]): string {
  if (!item.cloths.length) return '';
  const rows = item.cloths
    .map((cloth, index) => {
      const photo = clothPhotos[index];
      const hindi = clothLineHindi(
        cloth.clothName,
        cloth.nameHindi,
        cloth.variant
      );
      return `
        <tr>
          <td>
            <div class="cloth">
              ${photo ? `<img class="swatch" src="${photo}" alt="" />` : ''}
              <div>
                <div class="cloth-name">${escapeHtml(clothLineName(cloth))}</div>
                ${hindi ? `<div class="cloth-hi">${escapeHtml(hindi)}</div>` : ''}
              </div>
            </div>
          </td>
          <td class="right num">${formatMeters(cloth.lengthCm)}</td>
          <td class="right num">${formatRupees(cloth.pricePerMeterPaise)}</td>
          <td class="right num">${formatRupees(cloth.amountPaise)}</td>
        </tr>`;
    })
    .join('');
  return `
      <table>
        <thead>
          <tr>
            <th>Cloth · कपड़ा</th>
            <th class="right">Meters</th>
            <th class="right">Rate / meter</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
}

function pricing(item: PatternItem, clothPhotos: (string | null)[]): string {
  // No cloth and no stitching on it: nothing to break down, and no "₹0" to send.
  if (item.pricePaise <= 0) return '';
  const hasCloths = item.cloths.length > 0;
  const lines = hasCloths
    ? `
          <div class="row"><span>Cloth · कपड़ा</span><span class="num">${formatRupees(item.clothPaise)}</span></div>
          <div class="row"><span>Stitching · सिलाई</span><span class="num">${formatRupees(item.stitchingPaise)}</span></div>`
    : '';
  const needed = hasCloths
    ? `<div class="needed">Cloth needed in all: <b class="num">${formatMeters(totalLengthCm(item.cloths))}</b></div>`
    : '';
  return `
    <div class="part">
      <div class="heading">Price details <span class="hi">· कीमत का विवरण</span></div>
      ${clothTable(item, clothPhotos)}
      <div class="foot block">
        ${needed}
        <div class="sum">
          ${lines}
          <div class="total"><span>Total · कुल</span><span class="num">${formatRupees(item.pricePaise)}</span></div>
        </div>
      </div>
    </div>`;
}

/** The tailor's note on the design, in English and Hindi, or nothing. */
function noteBlock(item: PatternItem): string {
  if (!item.note) return '';
  const hindi = noteHindi(item.note, item.noteHindi);
  const lines = (text: string): string =>
    escapeHtml(text).replace(/\n/g, '<br />');
  return `
    <div class="part block">
      <div class="heading">Note <span class="hi">· नोट</span></div>
      <div class="design-note">
        ${lines(item.note)}
        ${hindi ? `<div class="note-hi">${lines(hindi)}</div>` : ''}
      </div>
    </div>`;
}

function contact(qr: string | null): string {
  const people = SHOP.contacts
    .map(
      ({ label, phone }) =>
        `<div><span class="who">${escapeHtml(label)}</span><span class="num">${formatMobile(phone)}</span></div>`
    )
    .join('');
  const code = qr
    ? `
      <div class="chat">
        <div class="right">Scan to chat<br />on WhatsApp</div>
        <img src="${qr}" alt="WhatsApp" />
      </div>`
    : '';
  return `
    <div class="part block">
      <div class="contact">
        <div>
          <div class="heading">Contact <span class="hi">· संपर्क</span></div>
          <div class="people">${people}</div>
          <div class="address">${escapeHtml(SHOP.address)}</div>
        </div>
        ${code}
      </div>
    </div>`;
}

/** The whole catalogue for one design, as HTML for expo-print to make a PDF of. */
export function buildDesignCatalogHtml(
  item: PatternItem,
  assets: DesignCatalogAssets
): string {
  const rateNote = item.cloths.length
    ? `Cloth is priced at the shop's rates on ${formatDate(assets.date.toISOString())}.`
    : '';
  const [first] = assets.photos;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(item.name)} — ${escapeHtml(SHOP.name)}</title>
<style>${STYLES}</style>
</head>
<body>
  ${letterhead(assets.logo)}
  ${title(item)}
  ${first ? picture(first, item.name) : ''}
  <section${first ? ' class="page"' : ''}>
    ${
      first
        ? `<div class="running"><span>${escapeHtml(SHOP.name)}</span><span>${escapeHtml(item.name)} · Design No. ${item.id}</span></div>`
        : ''
    }
    ${moreViews(item, assets.photos)}
    ${pricing(item, assets.clothPhotos)}
    ${noteBlock(item)}
    ${contact(assets.chatQr)}
    ${rateNote ? `<div class="fine">${rateNote}</div>` : ''}
  </section>
</body>
</html>`;
}
