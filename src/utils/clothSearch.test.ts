import type { Cloth } from '../repositories/clothRepo';
import { searchCloths } from './clothSearch';

const cloth = (id: number, name: string, rupees: number): Cloth => ({
  id,
  name,
  nameHindi: null,
  pricePerMeterPaise: Math.round(rupees * 100),
  imageName: null,
  note: null,
  noteHindi: null,
});

const catalog = [
  cloth(1, 'Armani', 1200),
  cloth(2, 'Raymond Cotton', 450),
  cloth(3, 'Linen White', 1200),
  cloth(4, 'Royal Silk', 900),
  cloth(5, 'Velvet Premium', 1500),
  cloth(6, 'Khadi 450', 250.5),
];

const names = (found: Cloth[]): string[] => found.map((c) => c.name);

describe('searchCloths', () => {
  it('returns everything for a blank search', () => {
    expect(searchCloths(catalog, '  ')).toHaveLength(catalog.length);
  });

  it('finds by name, ignoring case', () => {
    expect(names(searchCloths(catalog, 'ARMA'))).toEqual(['Armani']);
  });

  it('finds every cloth sold at the amount typed', () => {
    expect(names(searchCloths(catalog, '1200'))).toEqual([
      'Armani',
      'Linen White',
    ]);
  });

  it('accepts a rupee sign and spaces', () => {
    expect(names(searchCloths(catalog, '₹ 1200'))).toEqual([
      'Armani',
      'Linen White',
    ]);
  });

  it('narrows as more digits are typed', () => {
    expect(names(searchCloths(catalog, '1'))).toEqual([
      'Armani',
      'Linen White',
      'Velvet Premium',
    ]);
    expect(names(searchCloths(catalog, '15'))).toEqual(['Velvet Premium']);
  });

  it('matches paise too', () => {
    expect(names(searchCloths(catalog, '250.5'))).toEqual(['Khadi 450']);
  });

  it('does not match an amount against the middle of a price', () => {
    // 200 is inside 1200 but nothing is priced from ₹200.
    expect(searchCloths(catalog, '200')).toEqual([]);
  });

  it('still finds a number that is part of a name', () => {
    expect(names(searchCloths(catalog, '450'))).toEqual([
      'Raymond Cotton',
      'Khadi 450',
    ]);
  });
});
