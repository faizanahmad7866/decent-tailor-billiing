import {
  catalogFileName,
  designEnquiry,
  designMessage,
} from './designShareText';

const design = { id: 7, name: ' Royal Jodhpuri Suit ', pricePaise: 640000 };

describe('designMessage', () => {
  it('is one line naming the design, its price and the PDF to come', () => {
    const text = designMessage(design);
    expect(text).toBe(
      'Namaste 🙏 Decent Tailor se aapke liye design: *Royal Jodhpuri Suit (रॉयल जोधपुरी सूट)* — ₹6,400. Poora catalogue PDF abhi bhej rahe hain.'
    );
    expect(text).not.toContain('\n');
  });
});

describe('designMessage for a design with no price yet', () => {
  it('names the design and says nothing of ₹0', () => {
    const text = designMessage({ ...design, pricePaise: 0 });
    expect(text).toContain('Royal Jodhpuri Suit');
    expect(text).not.toContain('₹');
  });
});

describe('designEnquiry', () => {
  it('names the design by its number for the shop', () => {
    expect(designEnquiry(design)).toBe(
      'Hi Decent Tailor, I am interested in design No. 7 — Royal Jodhpuri Suit.'
    );
  });
});

describe('catalogFileName', () => {
  it('is the shop and the design', () => {
    expect(catalogFileName(design)).toBe(
      'Decent Tailor - Royal Jodhpuri Suit.pdf'
    );
  });

  it('drops what a file name cannot hold', () => {
    expect(catalogFileName({ ...design, name: 'Coat / Pant: "Set"?' })).toBe(
      'Decent Tailor - Coat Pant Set.pdf'
    );
  });

  it('falls back on the number for a name that is nothing but such characters', () => {
    expect(catalogFileName({ ...design, name: '///' })).toBe(
      'Decent Tailor - Design 7.pdf'
    );
  });
});
