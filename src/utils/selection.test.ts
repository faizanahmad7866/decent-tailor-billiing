import { addCountLabel, toggleSelected } from './selection';

describe('toggleSelected', () => {
  it('adds a new id at the end, keeping tap order', () => {
    expect(toggleSelected([3, 1], 2)).toEqual([3, 1, 2]);
  });

  it('takes an id out when it is tapped again', () => {
    expect(toggleSelected([3, 1, 2], 1)).toEqual([3, 2]);
  });

  it('does not change the list it was given', () => {
    const ids = [1, 2];
    toggleSelected(ids, 3);
    expect(ids).toEqual([1, 2]);
  });
});

describe('addCountLabel', () => {
  it('is singular for one and plural otherwise', () => {
    expect(addCountLabel(1, 'cloth')).toBe('Add 1 cloth');
    expect(addCountLabel(3, 'cloth')).toBe('Add 3 cloths');
  });
});
