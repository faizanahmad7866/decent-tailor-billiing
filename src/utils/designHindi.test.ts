import { designHindi, designNameToHindi } from './designHindi';

describe('designNameToHindi', () => {
  it.each([
    ['Royal Jodhpuri Suit', 'रॉयल जोधपुरी सूट'],
    ['Classic Black Bandhgala', 'क्लासिक ब्लैक बंदगला'],
    ['Wedding Sherwani', 'वेडिंग शेरवानी'],
    ['Indo Western Coat', 'इंडो वेस्टर्न कोट'],
    ['Designer Embroidered Prince Coat', 'डिज़ाइनर एम्ब्रॉइडर्ड प्रिंस कोट'],
    ['Pathani Kurta Pajama', 'पठानी कुर्ता पजामा'],
  ])('writes %s as %s', (name, hindi) => {
    expect(designNameToHindi(name)).toBe(hindi);
  });

  it('keeps numbers and punctuation, and drops a possessive s', () => {
    expect(designNameToHindi('3 Piece Suit (Slim)')).toBe('3 पीस सूट (स्लिम)');
    expect(designNameToHindi("Prince's Coat")).toBe('प्रिंस कोट');
  });

  it('falls back on the cloth names rules for a word it does not know', () => {
    expect(designNameToHindi('Armani Coat')).toBe('अरमानी कोट');
  });
});

describe('designHindi', () => {
  it('is null where there is nothing to add', () => {
    expect(designHindi('2024')).toBeNull();
    expect(designHindi('शेरवानी')).toBeNull();
    expect(designHindi('   ')).toBeNull();
  });

  it('is the Hindi otherwise', () => {
    expect(designHindi('Royal Jodhpuri Suit')).toBe('रॉयल जोधपुरी सूट');
  });
});
