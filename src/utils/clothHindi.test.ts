import { clothHindi, clothLineHindi, clothNameToHindi } from './clothHindi';

describe('clothNameToHindi', () => {
  it.each([
    ['Armani', 'अरमानी'],
    ['Raymond Cotton', 'रेमंड कॉटन'],
    ['Linen White', 'लिनन व्हाइट'],
    ['Royal Silk', 'रॉयल सिल्क'],
    ['Khadi Classic', 'खादी क्लासिक'],
    ['Velvet Premium', 'वेलवेट प्रीमियम'],
    ['Giza Cotton', 'गीज़ा कॉटन'],
    ['Bombay Dyeing', 'बॉम्बे डाइंग'],
  ])('writes %s as %s', (english, hindi) => {
    expect(clothNameToHindi(english)).toBe(hindi);
  });

  it('ignores case', () => {
    expect(clothNameToHindi('LINEN white')).toBe('लिनन व्हाइट');
  });

  it("drops a possessive's 's", () => {
    expect(clothNameToHindi("Siyaram's Suiting")).toBe('सियाराम सूटिंग');
  });

  it('keeps numbers and punctuation where they were', () => {
    expect(clothNameToHindi('Pure Wool 100% (Fine)')).toBe(
      'प्योर वूल 100% (फाइन)'
    );
    expect(clothNameToHindi('Reid & Taylor')).toBe('रीड & टेलर');
  });

  it('reads a word it does not know letter by letter, never leaving Latin', () => {
    const hindi = clothNameToHindi('Zorbex');
    expect(hindi).not.toMatch(/[A-Za-z]/);
    expect(hindi.length).toBeGreaterThan(0);
  });

  it('leaves a name already in Hindi, and a blank one, alone', () => {
    expect(clothNameToHindi('खादी')).toBe('खादी');
    expect(clothNameToHindi('  ')).toBe('  ');
  });
});

describe('the words a cloth type is called by', () => {
  it.each([
    ['Party Wear', 'पार्टी वियर'],
    ['Export Quality', 'एक्सपोर्ट क्वालिटी'],
    ['Matty', 'मैटी'],
    ['Summer', 'समर'],
    ['Digital Print', 'डिजिटल प्रिंट'],
    ['Royal Blue', 'रॉयल ब्लू'],
  ])('writes %s as %s', (name, hindi) => {
    expect(clothNameToHindi(name)).toBe(hindi);
  });
});

describe('clothHindi', () => {
  it('prefers what the tailor saved', () => {
    expect(clothHindi('Armani', 'आर्मानी')).toBe('आर्मानी');
  });

  it('works the name out when nothing was saved', () => {
    expect(clothHindi('Armani', null)).toBe('अरमानी');
    expect(clothHindi('Armani', '   ')).toBe('अरमानी');
  });

  it('is null when there is nothing to add beside the name', () => {
    expect(clothHindi('100', null)).toBeNull();
    expect(clothHindi('खादी', null)).toBeNull();
  });
});

describe('clothLineHindi', () => {
  it('writes the type in Hindi after the name, as the English reads', () => {
    expect(clothLineHindi('Armani', null, 'Royal Blue')).toBe(
      'अरमानी — रॉयल ब्लू'
    );
  });

  it('is the name alone when the line has no type', () => {
    expect(clothLineHindi('Armani', null)).toBe('अरमानी');
    expect(clothLineHindi('Armani', null, null)).toBe('अरमानी');
    expect(clothLineHindi('Armani', null, '  ')).toBe('अरमानी');
  });

  it('uses the Hindi the tailor saved for the name', () => {
    expect(clothLineHindi('Armani', 'अर्मानी', 'Blue')).toBe('अर्मानी — ब्लू');
  });

  it('keeps a type that has no letters to change as it is', () => {
    expect(clothLineHindi('Armani', null, '100')).toBe('अरमानी — 100');
  });

  it('is null when neither the name nor the type has anything to add', () => {
    expect(clothLineHindi('100', null, '200')).toBeNull();
    expect(clothLineHindi('100', null)).toBeNull();
  });

  it('still writes the type when the name has no Hindi of its own', () => {
    expect(clothLineHindi('100', null, 'Blue')).toBe('100 — ब्लू');
  });
});
