import type { PatternItem } from '../repositories/patternRepo';
import {
  buildDesignCatalogHtml,
  type DesignCatalogAssets,
} from './designCatalogHtml';

const item: PatternItem = {
  id: 7,
  categoryId: 1,
  categoryName: 'Jodhpuri',
  name: 'Royal Jodhpuri Suit',
  pricePaise: 640000,
  clothPaise: 490000,
  stitchingPaise: 150000,
  cloths: [
    {
      clothId: 1,
      clothName: 'Armani',
      nameHindi: null,
      imageName: 'a.jpg',
      variant: 'Royal blue',
      extraPerMeterPaise: 10000,
      pricePerMeterPaise: 130000,
      lengthCm: 300,
      amountPaise: 390000,
    },
    {
      clothId: 2,
      clothName: 'Lining',
      nameHindi: null,
      imageName: null,
      variant: null,
      extraPerMeterPaise: 0,
      pricePerMeterPaise: 40000,
      lengthCm: 250,
      amountPaise: 100000,
    },
  ],
  note: null,
  noteHindi: null,
  images: ['1.jpg', '2.jpg', '3.jpg'],
  videoName: null,
};

const assets: DesignCatalogAssets = {
  logo: 'data:image/png;base64,LOGO',
  photos: [
    'data:image/jpeg;base64,P1',
    'data:image/jpeg;base64,P2',
    'data:image/jpeg;base64,P3',
  ],
  clothPhotos: ['data:image/jpeg;base64,C1', null],
  chatQr: 'data:image/svg+xml,QR',
  date: new Date(2026, 9, 29),
};

const count = (html: string, text: string) => html.split(text).length - 1;

describe('buildDesignCatalogHtml', () => {
  const html = buildDesignCatalogHtml(item, assets);

  it('carries every photo of the design: the first large, the rest after it', () => {
    expect(count(html, 'P1')).toBe(1);
    expect(count(html, 'P2')).toBe(1);
    expect(count(html, 'P3')).toBe(1);
    expect(html).toContain('More views');
  });

  it('reads as a document: no dark bands, gradients or decorative type', () => {
    expect(html).not.toContain('linear-gradient');
    expect(html).not.toContain('Noto Serif');
    expect(html).not.toContain('Book your fitting');
    expect(html).not.toContain('Made to measure');
  });

  it('writes the design name in Hindi under the English one', () => {
    expect(html).toContain('रॉयल जोधपुरी सूट');
  });

  it('shows the shop: logo, tagline, both numbers and the address', () => {
    expect(html).toContain('LOGO');
    expect(html).toContain('The Genius of Pattern');
    expect(html).toContain('96656 67219');
    expect(html).toContain('96657 18519');
    expect(html).toContain('Lalkhadi Road');
    expect(html).toContain('QR');
  });

  it('lists each cloth with its meters, rate and amount, then cloth + stitching = price', () => {
    // The cloth's type follows its name, in English and in Hindi.
    expect(html).toContain('Armani — Royal blue');
    expect(html).toContain('Lining');
    expect(html).toContain('3 m');
    expect(html).toContain('₹1,300');
    expect(html).toContain('₹3,900');
    expect(html).toContain('2.5 m');
    expect(html).toContain('₹1,000');
    expect(html).toContain('₹4,900');
    expect(html).toContain('₹1,500');
    // Beside the name and in the total.
    expect(count(html, '₹6,400')).toBe(2);
    expect(html).toContain('5.5 m');
    expect(html).toContain('C1');
  });

  it('shows the note with its Hindi, and none without one', () => {
    expect(html).not.toContain('class="design-note"');
    const noted = buildDesignCatalogHtml(
      { ...item, note: 'Dry clean only\nReady in 7 days', noteHindi: null },
      assets
    );
    expect(noted).toContain('class="design-note"');
    expect(noted).toContain('Dry clean only<br />Ready in 7 days');
    // Its Hindi is worked out where none was saved.
    expect(noted).toContain('ड्राई क्लीन ओनली');
    const own = buildDesignCatalogHtml(
      { ...item, note: 'Dry clean only', noteHindi: 'सिर्फ ड्राई क्लीन' },
      assets
    );
    expect(own).toContain('सिर्फ ड्राई क्लीन');
    expect(own).not.toContain('ड्राई क्लीन ओनली');
  });

  it('asks for the price of a design with none, rather than sending ₹0', () => {
    const none = buildDesignCatalogHtml(
      {
        ...item,
        cloths: [],
        clothPaise: 0,
        stitchingPaise: 0,
        pricePaise: 0,
      },
      { ...assets, clothPhotos: [] }
    );
    expect(none).toContain('Ask for price');
    expect(none).not.toContain('₹0');
    expect(none).not.toContain('Price details');
  });

  it('escapes what the tailor typed', () => {
    const typed = buildDesignCatalogHtml(
      { ...item, name: 'Coat <b>& "Pant"</b>' },
      assets
    );
    expect(typed).not.toContain('<b>&');
    expect(typed).toContain('Coat &lt;b&gt;&amp; &quot;Pant&quot;&lt;/b&gt;');
  });

  it('has no gallery page for a design with one photo', () => {
    const one = buildDesignCatalogHtml(item, {
      ...assets,
      photos: assets.photos.slice(0, 1),
    });
    expect(one).not.toContain('More views');
  });

  it('sets the shop name in place of a logo that could not be read, and leaves out a photo there is none of', () => {
    const bare = buildDesignCatalogHtml(item, {
      ...assets,
      logo: null,
      photos: [],
    });
    expect(bare).toContain('class="wordmark">DECENT TAILOR');
    expect(bare).not.toContain('class="photo"');
    // With no photo to fill a first page, nothing is pushed on to a second.
    expect(bare).not.toContain('class="page"');
  });

  it('shows only the price for a design made before cloths were kept', () => {
    const old = buildDesignCatalogHtml(
      {
        ...item,
        cloths: [],
        clothPaise: 0,
        stitchingPaise: 0,
        pricePaise: 1500000,
      },
      { ...assets, clothPhotos: [] }
    );
    expect(old).not.toContain('<table>');
    expect(count(old, '₹15,000')).toBe(2);
  });
});
