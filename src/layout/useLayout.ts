import { useWindowDimensions } from 'react-native';

// The one place the app decides what kind of screen it is on. A phone gets the
// bottom tabs and one column; a tablet gets the navigation rail down its right
// edge and, when it is wide enough, pages in two columns. The same split as the
// main Decent Tailor app's.

/** Shortest side at this size or more: a tablet, whichever way it is held. */
export const TABLET_MIN_SIDE = 600;
/** Width at which a tablet has room for a page in two columns. */
export const EXPANDED_MIN_WIDTH = 960;

/** Width the navigation rail takes on a tablet. */
export const NAV_RAIL_WIDTH = 96;

/** Widest a one-column page grows: past this, lines get too long to scan. */
export const FORM_MAX_WIDTH = 720;
/** Widest a two-column page or a grid grows. */
export const WIDE_MAX_WIDTH = 1180;

export interface Layout {
  width: number;
  height: number;
  /** Never a phone — turning a tablet round never drops it to phone layout. */
  isTablet: boolean;
  /** A tablet wide enough for two columns: on its side, or a large one. */
  isExpanded: boolean;
  /** Width left for pages once the rail has taken its share. */
  contentWidth: number;
  /** Side padding of a page's content. */
  gutter: number;
  /** Widest the page's content goes, in one column or two. */
  pageMaxWidth: number;
}

export function computeLayout(width: number, height: number): Layout {
  const isTablet = Math.min(width, height) >= TABLET_MIN_SIDE;
  const contentWidth = isTablet ? width - NAV_RAIL_WIDTH : width;
  const isExpanded = isTablet && contentWidth >= EXPANDED_MIN_WIDTH;
  return {
    width,
    height,
    isTablet,
    isExpanded,
    contentWidth,
    gutter: isTablet ? 28 : 16,
    pageMaxWidth: isExpanded ? WIDE_MAX_WIDTH : FORM_MAX_WIDTH,
  };
}

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  return computeLayout(width, height);
}
