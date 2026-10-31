// The QR code on a cloth's label. It carries the cloth's number in the catalog
// and, on a type's own label, the type's — nothing else. The name and price are
// read from the catalog when it is scanned, so a price changed later is never
// out of date on a printed label. Numbers are never given out twice (the tables
// count up for good), so an old label can't point at a different cloth.

const PREFIX = 'DTB-CLOTH:';

export interface ScannedCloth {
  clothId: number;
  /** The type this label is for; null for a label of the whole cloth. */
  typeId: number | null;
}

/** What is written into the QR code for a cloth, or one type of it. */
export const clothQrPayload = (
  clothId: number,
  typeId: number | null = null
): string =>
  typeId === null ? `${PREFIX}${clothId}` : `${PREFIX}${clothId}:T${typeId}`;

/**
 * What a scanned code points at, or null if it isn't one of ours — a shop's own
 * QR, a payment code, anything else a camera might catch.
 */
export function parseClothQr(scanned: string): ScannedCloth | null {
  const match = /^DTB-CLOTH:(\d{1,9})(?::T(\d{1,9}))?$/.exec(scanned.trim());
  if (!match) return null;
  return {
    clothId: Number(match[1]),
    typeId: match[2] ? Number(match[2]) : null,
  };
}
