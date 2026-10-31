import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { shownDate } from '../../i18n/dates';
import { t } from '../../i18n/t';
import type { Offer } from '../../utils/offers';
import { Eyebrow } from './Eyebrow';
import { offerUrgency } from './OfferPoster';
import { showroomType } from './showroomType';

/**
 * An offer at the head of the collection, set as a card of type: the occasion,
 * the offer in the serif, what it is on, and until when.
 */
export const OfferBanner: React.FC<{
  offer: Offer;
  style?: StyleProp<ViewStyle>;
}> = ({ offer, style }) => {
  const occasion = offer.occasion.trim() || t('Special offer');
  return (
    <View style={[styles.card, style]}>
      <View style={styles.seal}>
        <Ionicons
          name={`${offer.icon}-outline` as const}
          size={20}
          color={SHOWROOM.gold}
        />
      </View>
      <View style={styles.words}>
        <Eyebrow>{occasion}</Eyebrow>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={[showroomType.display, styles.title]}
        >
          {offer.title}
        </Text>
        {offer.note.trim() ? (
          <Text numberOfLines={2} style={styles.note}>
            {offer.note}
          </Text>
        ) : null}
        <Text numberOfLines={2} style={styles.until}>
          {t('Till {0}', shownDate(offer.endsAt))}
          <Text style={styles.dot}>{'  ·  '}</Text>
          <Text style={styles.urgency}>{offerUrgency(offer.endsAt)}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = themedStyles(() => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: SHOWROOM.line,
    borderRadius: 2,
    backgroundColor: SHOWROOM.surface,
  },
  seal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SHOWROOM.goldDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontSize: 28, lineHeight: 32 },
  note: { fontFamily: FONT.regular, fontSize: 14, color: SHOWROOM.textMuted },
  until: {
    marginTop: 2,
    fontFamily: FONT.medium,
    fontSize: 12.5,
    color: SHOWROOM.textMuted,
  },
  dot: { color: SHOWROOM.textFaint },
  urgency: { color: SHOWROOM.gold },
}));
