import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { COLORS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { clothLineHindi } from '../utils/clothHindi';

interface ClothHindiTextProps {
  name: string;
  /** The Hindi saved for the cloth, if any. */
  saved: string | null;
  /** The cloth's type on a bill line, written in Hindi after the name. */
  variant?: string | null;
  style?: StyleProp<TextStyle>;
}

/**
 * A cloth's name in Hindi, to sit under the English one — in the very same
 * size and weight, so the two read as one name in two scripts. Shows nothing
 * when there is nothing to add (a name that is only numbers, or already
 * Hindi). `style` is for where the English name has a style of its own.
 */
export const ClothHindiText: React.FC<ClothHindiTextProps> = ({
  name,
  saved,
  variant,
  style,
}) => {
  const hindi = clothLineHindi(name, saved, variant);
  if (!hindi) return null;
  return (
    <Text numberOfLines={1} style={[styles.hindi, style]}>
      {hindi}
    </Text>
  );
};

const styles = themedStyles(() => ({
  // The same as the English name's own style in every list and on the bill.
  hindi: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
}));
