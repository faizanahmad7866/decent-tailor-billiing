import {
  gridColumns,
  isPicked,
  moreLikeThis,
  picksTotal,
  sortDesigns,
  togglePick,
  updatePick,
} from './showroomBrowse';

const design = (id: number, rupees: number, categoryId = 1) => ({
  id,
  categoryId,
  pricePaise: rupees * 100,
});

describe('sortDesigns', () => {
  const designs = [
    design(1, 4200),
    design(2, 0),
    design(3, 1850),
    design(4, 24500),
    design(5, 1850),
  ];
  const ids = (sorted: { id: number }[]) => sorted.map((d) => d.id);

  it('keeps the catalogue’s order for newest', () => {
    expect(ids(sortDesigns(designs, 'newest'))).toEqual([1, 2, 3, 4, 5]);
  });

  it('sorts by price both ways, a design with no price last', () => {
    expect(ids(sortDesigns(designs, 'priceLow'))).toEqual([3, 5, 1, 4, 2]);
    expect(ids(sortDesigns(designs, 'priceHigh'))).toEqual([4, 1, 3, 5, 2]);
  });

  it('does not change the list it is given', () => {
    sortDesigns(designs, 'priceHigh');
    expect(ids(designs)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('gridColumns', () => {
  it('fits more to a row as the screen widens', () => {
    expect(gridColumns(412)).toBe(2);
    expect(gridColumns(800)).toBe(3);
    expect(gridColumns(1280)).toBe(4);
  });
});

describe('picks', () => {
  const kurta = { designId: 5, pricePaise: 320000, fabrics: [] };
  const coat = { designId: 4, pricePaise: 1850000, fabrics: [] };
  const trouser = { designId: 9, pricePaise: 0, fabrics: [] };

  it('keeps a design, and takes it out again', () => {
    const kept = togglePick([], kurta);
    expect(isPicked(kept, 5)).toBe(true);
    expect(togglePick(kept, kurta)).toEqual([]);
  });

  it('brings a kept design up to date in its place', () => {
    const changed = {
      ...kurta,
      pricePaise: 350000,
      fabrics: ['Cotton — Fine'],
    };
    expect(updatePick([kurta, coat], changed)).toEqual([changed, coat]);
  });

  it('adds up the priced ones and counts the rest', () => {
    expect(picksTotal([kurta, coat, trouser])).toEqual({
      totalPaise: 2170000,
      unpriced: 1,
    });
  });
});

describe('moreLikeThis', () => {
  const designs = [
    design(1, 1, 1),
    design(2, 1, 2),
    design(3, 1, 1),
    design(4, 1, 1),
    design(5, 1, 1),
  ];

  it('walks on through the same category, round to its start', () => {
    expect(moreLikeThis(designs, designs[2], 3).map((d) => d.id)).toEqual([
      4, 5, 1,
    ]);
  });

  it('has nothing for a category of one', () => {
    expect(moreLikeThis(designs, designs[1], 3)).toEqual([]);
  });
});
