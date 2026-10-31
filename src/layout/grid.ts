import { GUTTER } from '../constants/theme';

export const GRID_GAP = 12;
const MAX_COLUMNS = 5;

/**
 * How a page-wide grid of cards fits the screen: at least two columns on a
 * phone, more on a tablet, each card at least `minCardWidth` wide.
 */
export function gridLayout(
  screenWidth: number,
  minCardWidth: number,
  gutter: number = GUTTER
): { columns: number; cardWidth: number } {
  const available = screenWidth - gutter * 2;
  const columns = Math.min(
    MAX_COLUMNS,
    Math.max(2, Math.floor((available + GRID_GAP) / (minCardWidth + GRID_GAP)))
  );
  return {
    columns,
    cardWidth: (available - GRID_GAP * (columns - 1)) / columns,
  };
}
