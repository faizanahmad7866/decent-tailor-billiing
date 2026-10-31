import React from 'react';
import { Text, View } from 'react-native';
import { GARMENT_IMAGES, garmentKey } from '../../constants/garments';
import { CARD, COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { shownCategory } from '../../i18n/names';
import { t } from '../../i18n/t';
import type { PatternCategory } from '../../repositories/patternRepo';
import { GarmentImage } from '../GarmentImage';
import { Tap } from '../Tap';
import { PatternPhoto } from './PatternPhoto';

interface CategoryCardProps {
  category: PatternCategory;
  width: number;
  onPress: () => void;
}

/**
 * A category as a cover, the way a menu opens with its sections: the photo of
 * its newest design filling the card — or, until it has one, the picture of
 * the garment it is named for — the name large across the bottom and how many
 * designs are inside in gold.
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  width,
  onPress,
}) => {
  const { name, itemCount, coverImage } = category;
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={t('{0}, {1} designs', name, itemCount)}
      style={[styles.card, { width, height: width * 1.2 }]}
    >
      {coverImage || !GARMENT_IMAGES[garmentKey(name)] ? (
        <PatternPhoto name={coverImage} style={styles.photo} />
      ) : (
        <View style={styles.garment}>
          <GarmentImage name={name} size={width * 0.6} />
        </View>
      )}
      <View style={styles.band}>
        <Text numberOfLines={2} style={styles.name}>
          {shownCategory(name)}
        </Text>
        <Text style={styles.count}>
          {itemCount === 0
            ? t('No designs yet')
            : itemCount === 1
              ? t('1 design')
              : t('{0} designs', itemCount)}
        </Text>
      </View>
    </Tap>
  );
};

const styles = themedStyles(() => ({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...CARD,
  },
  photo: { flex: 1 },
  // The garment's own picture, clear of the name band below it.
  garment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  band: {
    gap: 2,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  name: { ...TYPE.bodyStrong, fontSize: 16, color: COLORS.textPrimary },
  count: { ...TYPE.caption, color: COLORS.textSecondary },
}));
