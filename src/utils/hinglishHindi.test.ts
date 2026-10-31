import { isDevanagari, toHindi } from './hinglishHindi';

describe('toHindi', () => {
  it('writes the notes a tailor actually writes', () => {
    expect(toHindi('dhila rakhna')).toBe('ढीला रखना');
    expect(toHindi('pocket bada, astar lagana')).toBe(
      'पॉकेट बड़ा, अस्तर लगाना'
    );
    expect(toHindi('kamar tight, ghera thoda bada')).toBe(
      'कमर टाइट, घेरा थोड़ा बड़ा'
    );
  });

  it('leaves numbers and punctuation where they were', () => {
    expect(toHindi('2 inch lamba')).toBe('2 इंच लंबा');
    expect(toHindi('gala 15.5, chhati 40')).toBe('गला 15.5, छाती 40');
  });

  it('keeps a note already written in Hindi exactly as it is', () => {
    const note = 'ढीला रखना, पॉकेट बड़ा';
    expect(toHindi(note)).toBe(note);
  });

  it('writes a word it has never seen in Hindi letters, not English ones', () => {
    // Nothing in the shop's vocabulary, so it goes letter by letter — it
    // reads back as the same sounds.
    expect(isDevanagari(toHindi('sonu bhai'))).toBe(true);
    expect(toHindi('dori')).toBe('डोरी');
  });

  it('ties running consonants into one sound, as Hindi writes them', () => {
    // sT, not sa-Ta — the difference between a word that reads and one that
    // has to be puzzled out.
    expect(toHindi('stitch')).toBe('स्टिच');
    expect(toHindi('strip')).toBe('स्ट्रिप');
    expect(toHindi('chest')).toBe('चेस्ट');
  });

  it('ends a word on the long vowel a tailor hears', () => {
    expect(toHindi('mota')).toBe('मोटा');
    expect(toHindi('bakhiya')).toBe('बखिया');
    expect(toHindi('bhai')).toBe('भाई');
  });

  it("drops an English word's silent last e", () => {
    expect(toHindi('simple')).toBe('सिंपल');
    expect(toHindi('tikone')).toBe('टिकोन');
    // Two letters keep theirs — ke, se, me are words of their own.
    expect(toHindi('ke se me')).toBe('के से में');
  });

  it('has nothing to say about an empty note', () => {
    expect(toHindi('')).toBe('');
    expect(toHindi('   ')).toBe('   ');
  });
});

describe('isDevanagari', () => {
  it('knows Hindi letters from English ones', () => {
    expect(isDevanagari('ढीला')).toBe(true);
    expect(isDevanagari('dhila')).toBe(false);
    expect(isDevanagari('5 inch')).toBe(false);
  });
});
