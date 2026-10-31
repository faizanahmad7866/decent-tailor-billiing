import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { FONT, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { formatMeters } from '../../utils/billMath';
import { formatRupees } from '../../utils/money';
import { fabricLabel, type ShowroomPrice } from '../../utils/showroomPricing';
import { Eyebrow } from './Eyebrow';
import { showroomType } from './showroomType';

/**
 * What a design comes to, laid open: the price large, then each cloth — its
 * meters at its rate — and the stitching, so a customer can see where every rupee
 * goes without asking. A design with no breakdown shows its price alone; one with
 * no price says to ask.
 */
export const PriceBreakdown: React.FC<{
  price: ShowroomPrice;
  /** The price before its parts are known. */
  large?: boolean;
}> = ({ price, large = false }) => {
  if (price.totalPaise <= 0) return <AskForPrice />;
  const broken = price.lines.length > 0 || price.stitchingPaise > 0;
  return (
    <View style={styles.block}>
      <Eyebrow>{t('Price')}</Eyebrow>
      <Animated.Text
        key={price.totalPaise}
        entering={FadeIn.duration(320)}
        style={[showroomType.figure, large ? styles.totalLarge : styles.total]}
      >
        {formatRupees(price.totalPaise)}
      </Animated.Text>
      {price.changed ? (
        <Text style={styles.changed}>{t('With the fabric you chose')}</Text>
      ) : null}
      {broken ? (
        <View style={styles.rows}>
          {price.lines.map((line, at) => (
            <View key={at} style={styles.row}>
              <View style={styles.rowWords}>
                <Text numberOfLines={1} style={showroomType.label}>
                  {fabricLabel(line)}
                </Text>
                <Text style={showroomType.caption}>
                  {`${formatMeters(line.cloth.lengthCm)} × ${formatRupees(line.option.ratePaise)}`}
                </Text>
              </View>
              <Text style={showroomType.amount}>
                {formatRupees(line.amountPaise)}
              </Text>
            </View>
          ))}
          {price.stitchingPaise > 0 ? (
            <View style={styles.row}>
              <View style={styles.rowWords}>
                <Text style={showroomType.label}>{t('Stitching')}</Text>
              </View>
              <Text style={showroomType.amount}>
                {formatRupees(price.stitchingPaise)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <Text style={showroomType.caption}>
        {t('The tailor confirms the final price for your size.')}
      </Text>
    </View>
  );
};

/** In place of a price the tailor has not shown, or a design with none yet. */
export const AskForPrice: React.FC = () => (
  <View style={styles.ask}>
    <Ionicons name="chatbubbles-outline" size={20} color={SHOWROOM.gold} />
    <Text style={[showroomType.body, styles.askText]}>
      {t('Ask at the counter for the price')}
    </Text>
  </View>
);

const styles = themedStyles(() => ({
  block: { gap: 10 },
  total: { fontSize: 40, lineHeight: 46, color: SHOWROOM.text },
  totalLarge: { fontSize: 48, lineHeight: 54, color: SHOWROOM.text },
  changed: {
    fontFamily: FONT.medium,
    fontSize: 12.5,
    color: SHOWROOM.gold,
  },
  rows: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: SHOWROOM.line,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: SHOWROOM.line,
  },
  rowWords: { flex: 1, minWidth: 0, gap: 2 },
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: SHOWROOM.line,
    borderRadius: 2,
  },
  askText: { flex: 1, color: SHOWROOM.text },
}));
