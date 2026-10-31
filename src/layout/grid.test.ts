import { GRID_GAP, gridLayout } from './grid';

describe('gridLayout', () => {
  it('gives a phone two columns that fill the width', () => {
    const { columns, cardWidth } = gridLayout(360, 156);
    expect(columns).toBe(2);
    expect(cardWidth * 2 + GRID_GAP).toBe(360 - 32);
  });

  it('gives a tablet more columns, but never more than five', () => {
    expect(gridLayout(800, 156).columns).toBe(4);
    expect(gridLayout(2000, 156).columns).toBe(5);
  });
});
