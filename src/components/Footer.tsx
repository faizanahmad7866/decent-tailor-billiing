import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { useBottomInset } from '../layout/useBottomInset';
import { useLayout } from '../layout/useLayout';

interface FooterProps {
  /** Width of the page's content column, so the buttons line up with it. */
  maxWidth: number;
  children: React.ReactNode;
}

/**
 * The bar pinned under a form or a bill holding its main actions. It stays
 * in reach above the keyboard and clear of the phone's navigation bar.
 */
export const Footer: React.FC<FooterProps> = ({ maxWidth, children }) => {
  const { gutter } = useLayout();
  const bottomInset = useBottomInset();
  return (
    <View
      style={[
        styles.bar,
        { paddingHorizontal: gutter, paddingBottom: bottomInset + 12 },
      ]}
    >
      <View style={[styles.column, { maxWidth }]}>{children}</View>
    </View>
  );
};

const styles = themedStyles(() => ({
  bar: {
    paddingTop: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  column: { width: '100%', alignSelf: 'center', gap: 10 },
}));
