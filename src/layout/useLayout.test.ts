import { computeLayout, NAV_RAIL_WIDTH } from './useLayout';

describe('computeLayout', () => {
  it('sees a phone as a phone, upright or on its side', () => {
    for (const [width, height] of [
      [390, 844],
      [844, 390],
    ]) {
      expect(computeLayout(width, height)).toMatchObject({
        isTablet: false,
        isExpanded: false,
        contentWidth: width,
        gutter: 16,
      });
    }
  });

  it('keeps a tablet a tablet when it is turned, and leaves room for the rail', () => {
    expect(computeLayout(800, 1280)).toMatchObject({
      isTablet: true,
      isExpanded: false,
      contentWidth: 800 - NAV_RAIL_WIDTH,
      gutter: 28,
    });
    expect(computeLayout(1280, 800)).toMatchObject({
      isTablet: true,
      isExpanded: true,
      contentWidth: 1280 - NAV_RAIL_WIDTH,
    });
  });

  it('gives two columns only when a tablet has the width for them', () => {
    // A small tablet on its side: the rail leaves too little for two columns.
    expect(computeLayout(1000, 600).isExpanded).toBe(false);
    expect(computeLayout(1100, 600).isExpanded).toBe(true);
    expect(computeLayout(1100, 600).pageMaxWidth).toBeGreaterThan(
      computeLayout(1000, 600).pageMaxWidth
    );
  });
});
