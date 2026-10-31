import type { Cloth } from '../repositories/clothRepo';
import type { ClothType } from '../repositories/clothTypeRepo';
import { clothQrPayload } from '../utils/clothQr';
import {
  charsFor,
  printJob,
  qrBlock,
  textBlock,
  type PrintBlock,
} from './escpos';
import { wrap } from './receiptText';

// Each module of a label's QR code, in printer dots: a short code, so it can
// be drawn large (about 26 mm across) and read from a hand's length away.
const LABEL_QR_MODULE_DOTS = 10;

/**
 * The label for a cloth's roll, in the printer's own font: the cloth's name
 * big and bold, its type if the label is for one, and the QR code that adds the cloth to a bill when scanned. No
 * rate: scanning reads it from the catalog, so it is always today's, a label
 * stays right when a price changes, and a customer can't read it off the roll.
 * The printer's font has no Hindi, so the name is English.
 */
export function clothLabelJob(
  cloth: Cloth,
  type: ClothType | null = null
): PrintBlock[] {
  const name = wrap(cloth.name, charsFor({ big: true })).map((text) => ({
    text,
    big: true,
    bold: true,
  }));
  return printJob(
    textBlock([
      ...name,
      ...(type
        ? wrap(type.name, charsFor({})).map((text) => ({
            text,
            bold: true,
            tall: true,
          }))
        : []),
      { text: '' },
    ]),
    qrBlock(clothQrPayload(cloth.id, type?.id ?? null), LABEL_QR_MODULE_DOTS),
    textBlock([
      {
        text: type
          ? `Cloth No. ${cloth.id} / Type ${type.id}`
          : `Cloth No. ${cloth.id}`,
      },
    ])
  );
}
