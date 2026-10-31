import { parseAmountsHidden } from './amountsHiddenStore';

jest.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));

describe('parseAmountsHidden', () => {
  it('reads back what was saved', () => {
    expect(parseAmountsHidden('{"hidden":true}')).toBe(true);
    expect(parseAmountsHidden('{"hidden":false}')).toBe(false);
  });

  it('shows the totals on anything it does not know', () => {
    expect(parseAmountsHidden('{"hidden":"yes"}')).toBe(false);
    expect(parseAmountsHidden('null')).toBe(false);
  });
});
