import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { FONT, INITIAL_TILE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { initialOf } from '../utils/avatar';
import { clothPhotoUri } from '../storage/clothImageStore';

interface ClothThumbProps {
  name: string;
  imageName: string | null;
  style?: StyleProp<ViewStyle>;
}

/**
 * A cloth's photo, or — when it has none, or the file is gone — the first
 * letter of its name as a monogram, so every cloth is still recognisable at
 * a glance instead of showing a grey box.
 */
export const ClothThumb: React.FC<ClothThumbProps> = ({
  name,
  imageName,
  style,
}) => {
  const uri = imageName ? clothPhotoUri(imageName) : null;
  const tone = INITIAL_TILE;

  return (
    <View style={[styles.frame, { backgroundColor: tone.background }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Text style={[styles.monogram, { color: tone.foreground }]}>
          {initialOf(name)}
        </Text>
      )}
    </View>
  );
};

const styles = themedStyles(() => ({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: { fontFamily: FONT.bold, fontSize: 32 },
}));
