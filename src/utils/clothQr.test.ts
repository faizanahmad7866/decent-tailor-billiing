import { clothQrPayload, parseClothQr } from './clothQr';

describe('clothQrPayload', () => {
  it('writes the cloth number behind a prefix only this app uses', () => {
    expect(clothQrPayload(12)).toBe('DTB-CLOTH:12');
  });

  it('adds the type on a label for one type', () => {
    expect(clothQrPayload(12, 3)).toBe('DTB-CLOTH:12:T3');
  });
});

describe('parseClothQr', () => {
  it('reads back the number it wrote', () => {
    expect(parseClothQr(clothQrPayload(12))).toEqual({
      clothId: 12,
      typeId: null,
    });
    expect(parseClothQr(clothQrPayload(12, 3))).toEqual({
      clothId: 12,
      typeId: 3,
    });
  });

  it('ignores spaces around the code', () => {
    expect(parseClothQr(' DTB-CLOTH:7\n')).toEqual({
      clothId: 7,
      typeId: null,
    });
  });

  it.each([
    'upi://pay?pa=shop@bank&am=100',
    'https://example.com',
    'DTB-CLOTH:',
    'DTB-CLOTH:abc',
    'DTB-CLOTH:-3',
    'DTB-CLOTH:12:extra',
    'DTB-CLOTH:12:T',
    'DTB-CLOTH:12:3',
    'dtb-cloth:12',
    '12',
    '',
  ])('is null for something that is not a cloth code: %s', (text) => {
    expect(parseClothQr(text)).toBeNull();
  });
});
