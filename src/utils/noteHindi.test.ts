import { noteHindi, noteToHindi } from './noteHindi';

describe('noteToHindi', () => {
  it.each([
    ['Dry clean only', 'ड्राई क्लीन ओनली'],
    ['Pure wool, soft and imported', 'प्योर वूल, सॉफ्ट एंड इम्पोर्टेड'],
    ['Do not wash', 'डू नॉट वॉश'],
    ["Don't bleach", 'डू नॉट ब्लीच'],
    ['Best for winter', 'बेस्ट फॉर विंटर'],
    ['Made to order, ready in 7 days', 'मेड टू ऑर्डर, रेडी इन 7 डेज़'],
  ])('writes %s as %s', (note, hindi) => {
    expect(noteToHindi(note)).toBe(hindi);
  });

  it('keeps numbers and punctuation', () => {
    expect(noteToHindi('Limited stock (3 pair)')).toBe(
      'लिमिटेड स्टॉक (3 पेयर)'
    );
  });

  it('drops a possessive s', () => {
    expect(noteToHindi("Raymond's wool")).toBe(`${noteToHindi('Raymond')} वूल`);
  });

  it('leaves a note that is already Hindi', () => {
    expect(noteToHindi('ड्राई क्लीन')).toBe('ड्राई क्लीन');
  });
});

describe('noteHindi', () => {
  it('is what was saved, else what the note works out to', () => {
    expect(noteHindi('Dry clean only', 'सिर्फ ड्राई क्लीन')).toBe(
      'सिर्फ ड्राई क्लीन'
    );
    expect(noteHindi('Dry clean only', null)).toBe('ड्राई क्लीन ओनली');
  });

  it('is null where there is nothing to add', () => {
    expect(noteHindi('100', null)).toBeNull();
    expect(noteHindi('   ', null)).toBeNull();
  });
});
