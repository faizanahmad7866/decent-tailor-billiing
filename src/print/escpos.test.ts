import {
  bytesToBase64,
  jobBytes,
  printJob,
  qrBlock,
  textBlock,
  toPrinterText,
} from './escpos';

describe('toPrinterText', () => {
  it('spells what the printer font lacks the way printed bills do', () => {
    expect(toPrinterText('₹1,300 × 2 — Armani · Blue')).toBe(
      'Rs.1,300 x 2 - Armani - Blue'
    );
  });

  it('prints "?" for anything else outside ASCII', () => {
    expect(toPrinterText('अरमानी 5')).toBe('?????? 5');
  });
});

describe('textBlock', () => {
  it('sets alignment, weight and size for every line', () => {
    const block = textBlock([
      { text: 'DT', bold: true, big: true },
      { text: 'ok', align: 'left' },
      { text: 'T', tall: true },
    ]);
    // prettier-ignore
    expect(Array.from(block.bytes)).toEqual([
      0x1b, 0x61, 1, 0x1b, 0x45, 1, 0x1d, 0x21, 0x11, 0x44, 0x54, 0x0a,
      0x1b, 0x61, 0, 0x1b, 0x45, 0, 0x1d, 0x21, 0, 0x6f, 0x6b, 0x0a,
      0x1b, 0x61, 1, 0x1b, 0x45, 0, 0x1d, 0x21, 0x01, 0x54, 0x0a,
      0x1b, 0x45, 0, 0x1d, 0x21, 0, 0x1b, 0x61, 0,
    ]);
    // Big and tall lines are two ordinary ones high.
    expect(block.rows).toBe(60 + 30 + 60);
  });
});

describe('qrBlock', () => {
  it('stores the data in the printer and prints it as a model 2 code', () => {
    const bytes = Array.from(qrBlock('upi://pay').bytes);
    const has = (part: number[]) => bytes.join(',').includes(part.join(','));
    expect(has([0x1d, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0])).toBe(true);
    // Store: length is the data plus three.
    expect(has([0x1d, 0x28, 0x6b, 12, 0, 0x31, 0x50, 0x30])).toBe(true);
    expect(has(Array.from('upi://pay', (c) => c.charCodeAt(0)))).toBe(true);
    expect(has([0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30])).toBe(true);
  });
});

describe('printJob', () => {
  it('resets the printer first and feeds paper to tear at the end', () => {
    const job = printJob({ bytes: Uint8Array.of(0x41), rows: 30 });
    expect(Array.from(jobBytes(job))).toEqual([
      0x1b, 0x40, 0x41, 0x1b, 0x64, 4,
    ]);
    expect(job.map((b) => b.rows)).toEqual([30, 120]);
  });

  it('keeps the blocks it was given unchanged', () => {
    const block = { bytes: Uint8Array.of(0x41), rows: 30 };
    printJob([block]);
    expect(Array.from(block.bytes)).toEqual([0x41]);
  });
});

describe('bytesToBase64', () => {
  it('encodes long runs, beyond one slice', () => {
    const bytes = Uint8Array.from({ length: 20000 }, (_, i) => i % 256);
    expect(atob(bytesToBase64(bytes)).length).toBe(20000);
    expect(bytesToBase64(Uint8Array.of(0x1b, 0x40))).toBe('G0A=');
  });
});
