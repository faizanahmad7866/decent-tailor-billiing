import React from 'react';
import { Text, View } from 'react-native';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { clothLineAmount, formatMeters } from '../../utils/billMath';
import { formatRupees } from '../../utils/money';

interface PriceResultProps {
  lengthCm: number;
  /** The rate charged per meter: the catalog price and any extra. */
  ratePaise: number;
}

/**
 * What the meters just entered come to: the working ("3 m × ₹1,400 / meter")
 * and the amount under it, large. It sits right under the Meters box so the
 * price appears the moment a length is typed.
 */
export const PriceResult: React.FC<PriceResultProps> = ({
  lengthCm,
  ratePaise,
}) => {
  const amount = clothLineAmount({ pricePerMeterPaise: ratePaise, lengthCm });
  return (
    <View accessibilityLiveRegion="polite" style={styles.result}>
      <Text style={styles.working}>
        {lengthCm
          ? t(
              '{0} × {1} / meter',
              formatMeters(lengthCm),
              formatRupees(ratePaise)
            )
          : t('Enter the meters to see the price')}
      </Text>
      <Text style={[styles.amount, !lengthCm && styles.empty]}>
        {formatRupees(amount)}
      </Text>
    </View>
  );
};

const styles = themedStyles(() => ({
  result: {
    gap: 4,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryTint,
  },
  working: { ...TYPE.label, color: COLORS.textSecondary },
  amount: {
    ...TYPE.display,
    fontVariant: ['tabular-nums'],
    color: COLORS.accent,
  },
  empty: { color: COLORS.textMuted },
}));
