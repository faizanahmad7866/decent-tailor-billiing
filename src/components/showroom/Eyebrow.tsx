import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { themedStyles } from '../../constants/themedStyles';
import { isHindiText } from '../../i18n/names';
import { showroomType } from './showroomType';

/**
 * The small capitals over a heading — a category, a section. Spaced out as
 * fashion sets them, except in Hindi, which spacing pulls apart.
 */
export const Eyebrow: React.FC<{
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}> = ({ children, style, numberOfLines = 1 }) => (
  <Text
    numberOfLines={numberOfLines}
    style={[
      showroomType.eyebrow,
      !isHindiText(children) && styles.spaced,
      style,
    ]}
  >
    {children}
  </Text>
);

const styles = themedStyles(() => ({
  spaced: { letterSpacing: 2.4 },
}));
