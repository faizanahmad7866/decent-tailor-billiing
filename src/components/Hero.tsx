import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { CARD, COLORS, RADIUS } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';

interface HeroProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The summary at the top of a page: a white panel, like any other, with nothing
 * decorative. Content is laid out by the caller.
 */
export const Hero: React.FC<HeroProps> = ({ children, style }) => (
  <View style={[styles.hero, style]}>{children}</View>
);

const styles = themedStyles(() => ({
  hero: {
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...CARD,
  },
}));
