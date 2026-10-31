import qrcode from 'qrcode-generator';

/**
 * The shop's UPI payee, exactly as the main Decent Tailor app carries it
 * (src/print/upiQr.ts there), which is exactly as its bank's own QR carries
 * it. Every field is the bank's, unchanged: the account holder's name must
 * match the bank's record word for word, or the customer's UPI app warns that
 * the name doesn't match. Keep the two apps' copies identical.
 *
 * `mc=0000` marks this as a personal (P2P) UPI ID. When the shop moves to a
 * business QR, its fields replace these and nothing else has to change.
 */
export const SHOP_UPI = {
  payeeAddress: '9665718519junned@axl',
  payeeName: 'JUNAID KASHIF AB KALAM',
  /** The bank QR's own remaining fields, kept as it wrote them. */
  extra: { mc: '0000', mode: '02', purpose: '00' },
} as const;

/** 123450 paise as "1234.50", the two decimals a UPI link writes an amount in. */
function upiAmount(paise: number): string {
  const whole = Math.floor(paise / 100);
  return `${whole}.${String(paise % 100).padStart(2, '0')}`;
}

/**
 * A UPI payment link for an amount: the shop's own payee with the amount
 * filled in, so the customer scans, sees the figure, and enters only their
 * PIN — NPCI's standard `upi://pay` link, the one every UPI app reads. The
 * note sits beside the payment in the shop's own UPI history.
 *
 * The app never touches the money: the customer's own app pays the shop's
 * bank directly. This only writes down who to pay and how much.
 */
export function upiPaymentLink(amountPaise: number, note: string): string {
  const params: Array<[string, string]> = [
    ['pa', SHOP_UPI.payeeAddress],
    ['pn', SHOP_UPI.payeeName],
    ...Object.entries(SHOP_UPI.extra),
    ['am', upiAmount(amountPaise)],
    ['cu', 'INR'],
    // Letters, digits, spaces and hyphens only: every UPI app reads those.
    ['tn', note.replace(/[^A-Za-z0-9 -]/g, '').slice(0, 50)],
  ];
  // Encoded the way the bank's own QR is: spaces as %20, but the @ of the
  // UPI ID left as it is — some UPI apps won't read an encoded one.
  const encode = (value: string): string =>
    encodeURIComponent(value).replace(/%40/g, '@');
  return `upi://pay?${params
    .map(([key, value]) => `${key}=${encode(value)}`)
    .join('&')}`;
}

/** The quiet zone scanners need around a code: four modules on each side. */
export const QR_QUIET_MODULES = 4;

/**
 * A QR code for `text`, drawn as one SVG path on a square of `size` units —
 * the dark modules, with the quiet zone scanners need already around them.
 * Medium error correction: a bill gets folded, creased and handled, and a
 * phone camera still reads it.
 *
 * Geometry only, so the printed bill and the screen the customer scans off
 * are the same code from the same code — one drawn into an <img>, the other
 * into a react-native-svg <Path>.
 */
export function qrSvgPath(text: string): { size: number; path: string } {
  const code = qrcode(0, 'M');
  code.addData(text);
  code.make();

  const count = code.getModuleCount();
  const quiet = QR_QUIET_MODULES;
  let path = '';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (code.isDark(row, col)) {
        path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
      }
    }
  }

  return { size: count + quiet * 2, path };
}

/**
 * The same code as an SVG data URI, for the <img> on a printed or shared
 * bill: it shows at any size and still prints sharp.
 */
export function qrDataUri(text: string): string {
  const { size, path } = qrSvgPath(text);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `shape-rendering="crispEdges"><rect width="${size}" height="${size}" ` +
    `fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * The QR a bill prints: the shop's UPI with the balance filled in and the
 * bill number as the note. The note is short on purpose — every character
 * makes the code denser, and a printed QR is small.
 */
export function billPaymentQr(amountPaise: number, billId: number): string {
  return qrDataUri(upiPaymentLink(amountPaise, `Bill ${billId}`));
}
