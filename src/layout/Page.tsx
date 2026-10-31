import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { themedStyles } from '../constants/themedStyles';
import { useBottomInset } from './useBottomInset';
import { FORM_MAX_WIDTH, useLayout } from './useLayout';

/** Space between the blocks of a page. */
const BLOCK_GAP = 16;
/** The left column's share of a two-column page. */
const WIDE_COLUMN_FLEX = 1.15;

/**
 * The padding of a page's scrolling content: the screen's gutter at the sides,
 * and at the foot enough to clear the system bar — or, on a page with a Footer
 * (which clears the bar itself), just a little breathing room.
 */
export function usePagePadding({ footer = false } = {}): ViewStyle {
  const { gutter, isTablet } = useLayout();
  const bottomInset = useBottomInset();
  return {
    paddingHorizontal: gutter,
    paddingTop: isTablet ? 24 : 16,
    paddingBottom: footer ? 32 : bottomInset + 32,
  };
}

interface PageColumnProps {
  children: React.ReactNode;
  /** A page that goes to two columns: it may grow as wide as they need. */
  wide?: boolean;
}

/** A page's content, centred, and no wider than still reads comfortably. */
export const PageColumn: React.FC<PageColumnProps> = ({
  children,
  wide = false,
}) => {
  const { pageMaxWidth } = useLayout();
  return (
    <View
      style={[
        styles.column,
        { maxWidth: wide ? pageMaxWidth : FORM_MAX_WIDTH },
      ]}
    >
      {children}
    </View>
  );
};

interface PageColumnsProps {
  /** The page's main content. */
  first: React.ReactNode;
  /** What goes beside it on a wide tablet, and under it everywhere else. */
  second: React.ReactNode;
}

/**
 * A page in two columns on a wide tablet and in one everywhere else, in the
 * same order — so a phone reads exactly as `first` then `second`.
 */
export const PageColumns: React.FC<PageColumnsProps> = ({ first, second }) => {
  const { isExpanded } = useLayout();
  if (!isExpanded) {
    return (
      <>
        {first}
        {second}
      </>
    );
  }
  return (
    <View style={styles.row}>
      <View style={[styles.side, { flex: WIDE_COLUMN_FLEX }]}>{first}</View>
      <View style={[styles.side, styles.second]}>{second}</View>
    </View>
  );
};

const styles = themedStyles(() => ({
  column: { width: '100%', alignSelf: 'center', gap: BLOCK_GAP },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  side: { gap: BLOCK_GAP, minWidth: 0 },
  second: { flex: 1 },
}));
