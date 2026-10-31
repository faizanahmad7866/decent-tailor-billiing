import type { PatternItemSummary } from '../repositories/patternRepo';
import { searchPatternItems } from './patternSearch';

const item = (
  id: number,
  name: string,
  rupees: number
): PatternItemSummary => ({
  id,
  categoryId: 1,
  name,
  pricePaise: Math.round(rupees * 100),
  coverImage: null,
  hasVideo: false,
});

const designs = [
  item(1, 'Royal Jodhpuri', 15000),
  item(2, 'Wedding Jodhpuri', 22000),
  item(3, 'Plain Jodhpuri', 15000),
  item(4, 'Velvet Suit 2024', 18000),
];

const names = (found: PatternItemSummary[]): string[] =>
  found.map((d) => d.name);

describe('searchPatternItems', () => {
  it('returns everything for a blank search', () => {
    expect(searchPatternItems(designs, '  ')).toHaveLength(designs.length);
  });

  it('finds by name, ignoring case', () => {
    expect(names(searchPatternItems(designs, 'WEDDing'))).toEqual([
      'Wedding Jodhpuri',
    ]);
  });

  it('finds every design at the price typed', () => {
    expect(names(searchPatternItems(designs, '15000'))).toEqual([
      'Royal Jodhpuri',
      'Plain Jodhpuri',
    ]);
  });

  it('matches the front of a price while it is being typed, with a ₹ too', () => {
    expect(names(searchPatternItems(designs, '₹ 22'))).toEqual([
      'Wedding Jodhpuri',
    ]);
  });

  it('also finds a number that is part of a name', () => {
    expect(names(searchPatternItems(designs, '2024'))).toEqual([
      'Velvet Suit 2024',
    ]);
  });

  it('finds nothing for a word no design has', () => {
    expect(searchPatternItems(designs, 'sherwani')).toEqual([]);
  });
});
