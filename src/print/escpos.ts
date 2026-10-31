// ESC/POS commands for a 58 mm thermal printer, the way receipt apps print:
// text in the printer's own font and a QR code the printer draws itself.
// Both are tiny to send and every ESC/POS printer obeys them, where a
// receipt sent as one big picture is many image commands — and plenty of
// printers print only the first.

import { QR_QUIET_MODULES, qrSvgPath } from './upiQr';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

/** Characters across 58 mm paper in the printer's own font (12 dots each). */
export const LINE_CHARS = 32;

// The printer's own font: 24 dots tall plus the default 6-dot line gap.
const TEXT_LINE_ROWS = 30;

// Blank lines fed after the receipt, so its end clears the tear bar.
const FEED_LINES = 4;

/**
 * One piece of a print job, and how many dot rows it prints. A job is sent
 * a block at a time, each given the time it takes to print before the next,
 * so a printer is never sent data while it is still busy.
 */
export interface PrintBlock {
  bytes: Uint8Array;
  rows: number;
}

export interface TextLine {
  text: string;
  bold?: boolean;
  /** Double width and height: half as many characters fit. */
  big?: boolean;
  /** Double height only, full width. */
  tall?: boolean;
  /** Centred unless said otherwise. */
  align?: 'left' | 'center';
}

/** How many characters fit across in a line of this style. */
export const charsFor = (line: Pick<TextLine, 'big'>): number =>
  line.big ? LINE_CHARS / 2 : LINE_CHARS;

/** Rows a line of this style takes on paper. */
const rowsFor = (line: Pick<TextLine, 'big' | 'tall'>): number =>
  line.big || line.tall ? TEXT_LINE_ROWS * 2 : TEXT_LINE_ROWS;

/**
 * The printer's font knows ASCII only. The few characters a bill uses that
 * it lacks are spelled the way printed bills spell them; anything else
 * prints as "?".
 */
export function toPrinterText(text: string): string {
  return text
    .replace(/₹/g, 'Rs.')
    .replace(/[—–]/g, '-')
    .replace(/×/g, 'x')
    .replace(/·/g, '-')
    .replace(/[^\x20-\x7e]/g, '?');
}

/** Lines in the printer's own font. */
export function textBlock(lines: TextLine[]): PrintBlock {
  const parts: Uint8Array[] = [];
  let rows = 0;
  for (const line of lines) {
    const { bold = false, big = false, tall = false, align = 'center' } = line;
    const size = big ? 0x11 : tall ? 0x01 : 0;
    parts.push(
      Uint8Array.of(
        ESC,
        0x61,
        align === 'left' ? 0 : 1,
        ESC,
        0x45,
        bold ? 1 : 0,
        GS,
        0x21,
        size
      ),
      Uint8Array.from(
        Array.from(toPrinterText(line.text), (c) => c.charCodeAt(0))
      ),
      Uint8Array.of(LF)
    );
    rows += rowsFor(line);
  }
  parts.push(Uint8Array.of(ESC, 0x45, 0, GS, 0x21, 0, ESC, 0x61, 0));
  return { bytes: concat(parts), rows };
}

// Each module of the QR code, in printer dots, unless asked for another.
export const QR_MODULE_DOTS = 6;

/**
 * A centred QR code the printer draws itself (GS ( k, model 2): sharp, and
 * a few dozen bytes instead of a picture. `moduleDots` sizes it: the more
 * dots a module has, the easier it scans.
 */
export function qrBlock(
  data: string,
  moduleDots: number = QR_MODULE_DOTS
): PrintBlock {
  const payload = Uint8Array.from(
    Array.from(toPrinterText(data), (c) => c.charCodeAt(0))
  );
  const store = payload.length + 3;
  const bytes = concat([
    Uint8Array.of(ESC, 0x61, 1),
    // Model 2.
    Uint8Array.of(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0),
    // Module size, in dots.
    Uint8Array.of(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, moduleDots),
    // Error correction level M.
    Uint8Array.of(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31),
    // Store the data, then print it.
    Uint8Array.of(GS, 0x28, 0x6b, store & 0xff, store >> 8, 0x31, 0x50, 0x30),
    payload,
    Uint8Array.of(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30),
    Uint8Array.of(LF, ESC, 0x61, 0),
  ]);
  // The printer picks the smallest code that holds the data, the same size
  // as the one the app draws (model 2, level M) — its quiet zone removed.
  const modules = qrSvgPath(data).size - 2 * QR_QUIET_MODULES;
  return { bytes, rows: modules * moduleDots + TEXT_LINE_ROWS };
}

/**
 * A whole print: the printer reset before the first block, then a little
 * paper fed at the end to tear against.
 */
export function printJob(
  ...parts: (PrintBlock | PrintBlock[])[]
): PrintBlock[] {
  const blocks = parts.flat().map((block) => ({ ...block }));
  const reset = Uint8Array.of(ESC, 0x40);
  if (blocks.length) blocks[0].bytes = concat([reset, blocks[0].bytes]);
  else blocks.push({ bytes: reset, rows: 0 });
  blocks.push({
    bytes: Uint8Array.of(ESC, 0x64, FEED_LINES),
    rows: FEED_LINES * TEXT_LINE_ROWS,
  });
  return blocks;
}

/** Every byte of a job, in order. */
export function jobBytes(blocks: PrintBlock[]): Uint8Array {
  return concat(blocks.map((block) => block.bytes));
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  // In slices: String.fromCharCode can't take a whole job's bytes at once.
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x2000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x2000));
  }
  return btoa(binary);
}
