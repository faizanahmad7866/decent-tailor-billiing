import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { patternMediaUri } from '../../storage/patternMediaStore';

/**
 * The warm paper a design's photo is shown on, as a print hangs in a gallery.
 * Holds MatLayers, or anything laid over them (a button, a count).
 */
export const Mat: React.FC<{
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}> = ({ style, children }) => (
  <View style={[styles.mat, style]}>{children}</View>
);

/**
 * One photo on a Mat: whole, never cropped, and multiplied into the paper, so the
 * white of a photo taken against a wall becomes the mat itself and every design
 * stands on the same ground, however it was photographed. Stack several to fade
 * between them.
 */
export const MatLayer: React.FC<{
  name: string;
  /** Room around the photo on its mat. */
  inset?: number;
  /** A small photo, in a grid: read at the size shown, not the file's. */
  small?: boolean;
  /** Moves or fades the photo on its mat. */
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
}> = ({ name, inset = 0, small = false, style }) => {
  const uri = patternMediaUri(name);
  if (!uri) return null;
  return (
    <Animated.View
      style={[
        styles.layer,
        { top: inset, right: inset, bottom: inset, left: inset },
        style,
      ]}
    >
      <Image
        source={{ uri }}
        resizeMode="contain"
        resizeMethod={small ? 'resize' : 'auto'}
        accessibilityIgnoresInvertColors
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

interface MatPhotoProps {
  /** The photo's file name; null for none. */
  name: string | null;
  style?: StyleProp<ViewStyle>;
  inset?: number;
  small?: boolean;
  children?: React.ReactNode;
}

/** A design's one photo on its mat; a garment drawn faintly where it has none. */
export const MatPhoto: React.FC<MatPhotoProps> = ({
  name,
  style,
  inset = 0,
  small = false,
  children,
}) => {
  const shown = name !== null && patternMediaUri(name) !== null;
  return (
    <Mat style={style}>
      {shown ? (
        <MatLayer name={name} inset={inset} small={small} />
      ) : (
        <Ionicons
          name="shirt-outline"
          size={small ? 32 : 48}
          color={SHOWROOM.goldDeep}
        />
      )}
      {children}
    </Mat>
  );
};

const styles = themedStyles(() => ({
  mat: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    backgroundColor: SHOWROOM.mat,
    // The blend stays inside the mat.
    isolation: 'isolate',
  },
  layer: { position: 'absolute', mixBlendMode: 'multiply' },
}));
