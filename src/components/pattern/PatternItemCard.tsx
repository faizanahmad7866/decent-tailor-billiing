import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD, COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import type { PatternItemSummary } from '../../repositories/patternRepo';
import { designHindi } from '../../utils/designHindi';
import { designPriceText } from '../../utils/patternPricing';
import { Tap } from '../Tap';
import { PatternPhoto } from './PatternPhoto';

interface PatternItemCardProps {
  item: PatternItemSummary;
  width: number;
  onPress: () => void;
}

/**
 * A design as a page of a lookbook: its photo filling a tall card, the name
 * and the price on a dark band across the bottom, the price in gold — and a
 * small play sign in the corner when there is a video to watch.
 */
export const PatternItemCard: React.FC<PatternItemCardProps> = ({
  item,
  width,
  onPress,
}) => {
  const hindi = designHindi(item.name);
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={`${item.name}, ${t(designPriceText(item.pricePaise))}${item.hasVideo ? t(', has a video') : ''}`}
      style={[styles.card, { width, height: width * 1.35 }]}
    >
      <PatternPhoto name={item.coverImage} style={styles.photo} />
      {item.hasVideo ? (
        <View style={styles.play}>
          <Ionicons name="play" size={16} color={COLORS.textOnDark} />
        </View>
      ) : null}
      <View style={styles.band}>
        <Text numberOfLines={hindi ? 1 : 2} style={styles.name}>
          {item.name}
        </Text>
        {hindi ? (
          <Text numberOfLines={1} style={styles.hindi}>
            {hindi}
          </Text>
        ) : null}
        <Text style={styles.price}>{t(designPriceText(item.pricePaise))}</Text>
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
  play: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.scrim,
  },
  photo: { flex: 1 },
  band: {
    gap: 2,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  name: { ...TYPE.bodyStrong, fontSize: 14, color: COLORS.textPrimary },
  hindi: { ...TYPE.caption, color: COLORS.textSecondary },
  price: { ...TYPE.price, marginTop: 2, color: COLORS.textPrimary },
}));
