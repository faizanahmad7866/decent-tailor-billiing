import type { Cloth } from '../repositories/clothRepo';
import { clothLabelJob } from './clothLabel';
import { jobBytes } from './escpos';

const cloth: Cloth = {
  id: 12,
  name: 'Armani',
  nameHindi: 'अरमानी',
  pricePerMeterPaise: 130000,
  imageName: null,
  note: null,
  noteHindi: null,
};

// The printable ASCII in a job, so the text on the label can be looked at.
const asText = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) =>
    b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '\n'
  ).join('');

describe('clothLabelJob', () => {
  const text = asText(jobBytes(clothLabelJob(cloth)));

  it('names the cloth and its number', () => {
    expect(text).toContain('Armani');
    expect(text).toContain('Cloth No. 12');
  });

  it('prints no rate: scanning reads it from the catalog', () => {
    expect(text).not.toContain('Rs.');
    expect(text).not.toContain('1,300');
    expect(text).not.toContain('meter');
  });

  it('on a label for one type, names the type and carries its own QR', () => {
    const royal = {
      id: 3,
      clothId: 12,
      name: 'Royal Blue',
      pricePerMeterPaise: 100000,
      imageName: null,
    };
    const typed = asText(jobBytes(clothLabelJob(cloth, royal)));
    expect(typed).toContain('Armani');
    expect(typed).toContain('Royal Blue');
    expect(typed).toContain('DTB-CLOTH:12:T3');
    expect(typed).toContain('Cloth No. 12 / Type 3');
    // Its rate is read when it is scanned, as with any label.
    expect(typed).not.toContain('Rs.');
  });

  it('carries the QR that identifies the cloth when scanned', () => {
    expect(text).toContain('DTB-CLOTH:12');
  });

  it('sets the QR module size for a large, easy-to-scan code', () => {
    const bytes = Array.from(jobBytes(clothLabelJob(cloth)));
    const at = bytes.findIndex(
      (_, i) =>
        bytes.slice(i, i + 8).join() ===
        [0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x43, 10].join()
    );
    expect(at).toBeGreaterThan(-1);
  });

  it('wraps a long name over lines of the big type, never cutting a word', () => {
    const long = asText(
      jobBytes(clothLabelJob({ ...cloth, name: 'Raymond Cotton Blue Premium' }))
    );
    // Big type fits 16 characters a line.
    expect(long).toContain('Raymond Cotton');
    expect(long).toContain('Blue Premium');
  });
});
