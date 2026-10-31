import React from 'react';
import { Text, View } from 'react-native';
import { COLORS, FONT, tracking } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { ClothHindiText } from './ClothHindiText';

interface ClothNamesProps {
  /** What is written in English: the cloth's name, or name and sub-type. */
  title: string;
  /** The cloth's own name, which its Hindi is made from. */
  name: string;
  /** The Hindi saved for the cloth, if any. */
  hindi: string | null;
  /** The cloth's type on a bill line: its Hindi follows the name's. */
  variant?: string | null;
  /** Font size; the Hindi line is the same, so the two read as one name. */
  size: number;
  /** Lines the English may take before it is cut. */
  lines?: number;
  /** Lines of height kept for the English, so cards in a row stay level. */
  reserveLines?: number;
}

/**
 * A cloth's name as the tailor looks for it: big and heavy, English with the
 * Hindi under it in the very same size. One place for it, so the catalog, the
 * picker and a saved bill all name a cloth the same way.
 */
export const ClothNames: React.FC<ClothNamesProps> = ({
  title,
  name,
  hindi,
  variant,
  size,
  lines = 2,
  reserveLines = 0,
}) => {
  const lineHeight = Math.round(size * 1.3);
  return (
    <View style={{ minHeight: lineHeight * (reserveLines + 1) }}>
      <Text
        numberOfLines={lines}
        style={[styles.name, { fontSize: size, lineHeight }]}
      >
        {title}
      </Text>
      <ClothHindiText
        name={name}
        saved={hindi}
        variant={variant}
        style={[styles.name, { fontSize: size, lineHeight }]}
      />
    </View>
  );
};

const styles = themedStyles(() => ({
  name: {
    fontFamily: FONT.extrabold,
    letterSpacing: tracking(-0.3),
    color: COLORS.textPrimary,
  },
}));
