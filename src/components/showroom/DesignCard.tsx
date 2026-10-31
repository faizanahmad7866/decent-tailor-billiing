import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import type { ShowroomDesign } from '../../repositories/patternRepo';
import { designHindi } from '../../utils/designHindi';
import { designPriceText } from '../../utils/patternPricing';
import { Tap } from '../Tap';
import { HeartButton } from './HeartButton';
import { MatPhoto } from './MatPhoto';
import { showroomType } from './showroomType';

/** A photo a little taller than wide, as a garment stands. */
export const CARD_PHOTO_RATIO = 1.28;

interface DesignCardProps {
  design: ShowroomDesign;
  width: number;
  showPrice: boolean;
  picked: boolean;
  onOpen: () => void;
  onTogglePick: () => void;
}

/**
 * A design in the collection's grid, as a lookbook page: the photo on its mat, the
 * name in the serif with its Hindi under it, and the price where the tailor shows
 * prices. The heart keeps it; a small count says it has more photos to see.
 */
export const DesignCard: React.FC<DesignCardProps> = ({
  design,
  width,
  showPrice,
  picked,
  onOpen,
  onTogglePick,
}) => {
  const hindi = designHindi(design.name);
  const photos = design.images.length;
  const nameSize = width >= 260 ? 22 : 19;
  return (
    <Tap
      onPress={onOpen}
      accessibilityLabel={design.name}
      style={[styles.card, { width }]}
    >
      <MatPhoto
        name={design.images[0] ?? null}
        small
        inset={Math.round(width * 0.07)}
        style={{ width, height: Math.round(width * CARD_PHOTO_RATIO) }}
      >
        <HeartButton
          picked={picked}
          onPress={onTogglePick}
          size={width >= 260 ? 44 : 38}
          style={styles.heart}
        />
        {photos > 1 ? (
          <View style={styles.photos}>
            <Ionicons name="images-outline" size={13} color={SHOWROOM.text} />
            <Text style={styles.photosText}>{photos}</Text>
          </View>
        ) : null}
      </MatPhoto>
      <View style={styles.words}>
        <Text
          numberOfLines={2}
          style={[
            showroomType.display,
            { fontSize: nameSize, lineHeight: Math.round(nameSize * 1.12) },
          ]}
        >
          {design.name}
        </Text>
        {hindi ? (
          <Text numberOfLines={1} style={[showroomType.hindi, styles.hindi]}>
            {hindi}
          </Text>
        ) : null}
        {showPrice ? (
          <Text
            style={[
              styles.price,
              design.pricePaise > 0 ? styles.priced : styles.unpriced,
            ]}
          >
            {t(designPriceText(design.pricePaise))}
          </Text>
        ) : null}
      </View>
    </Tap>
  );
};

const styles = themedStyles(() => ({
  card: { gap: 14 },
  heart: { position: 'absolute', top: 10, right: 10 },
  photos: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    backgroundColor: SHOWROOM.scrim,
  },
  photosText: {
    fontFamily: FONT.medium,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.text,
  },
  words: { gap: 4, paddingRight: 4 },
  hindi: { fontSize: 13 },
  price: {
    marginTop: 4,
    fontFamily: FONT.medium,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  priced: { color: SHOWROOM.gold },
  unpriced: {
    fontFamily: FONT.regular,
    fontSize: 13,
    color: SHOWROOM.textFaint,
  },
}));
