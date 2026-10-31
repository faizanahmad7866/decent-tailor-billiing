import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageResizeMode,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { patternMediaUri } from '../../storage/patternMediaStore';

interface PatternPhotoProps {
  /** The photo's file name; null for an item or category with none. */
  name: string | null;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
}

/**
 * A photo of the catalogue, or — when there is none, or the file is gone —
 * a solid ink tile with a faint garment in gold, so a design without a photo
 * still looks like part of the catalogue instead of a broken picture.
 */
export const PatternPhoto: React.FC<PatternPhotoProps> = ({
  name,
  style,
  resizeMode = 'cover',
}) => {
  const uri = name ? patternMediaUri(name) : null;
  return (
    <View style={[styles.frame, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode={resizeMode}
          accessibilityIgnoresInvertColors
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Ionicons
          name="shirt-outline"
          size={44}
          color={COLORS.gold}
          style={styles.icon}
        />
      )}
    </View>
  );
};

const styles = themedStyles(() => ({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink,
  },
  icon: { opacity: 0.45 },
}));
