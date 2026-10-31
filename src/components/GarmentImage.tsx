import React from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GARMENT_IMAGES, garmentKey } from '../constants/garments';
import { COLORS } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';

interface GarmentImageProps {
  name: string;
  size: number;
}

/** The garment's picture, or a plain garment outline when it has none. */
export const GarmentImage: React.FC<GarmentImageProps> = ({ name, size }) => {
  const source = GARMENT_IMAGES[garmentKey(name)];
  if (source) {
    return (
      <Image
        source={source}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <Ionicons name="shirt-outline" size={size * 0.5} color={COLORS.accent} />
    </View>
  );
};

const styles = themedStyles(() => ({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: COLORS.primaryTint,
  },
}));
