import React from 'react';
import { Text } from 'react-native';
import { COLORS, FONT, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { formatRupees } from '../utils/money';

interface ClothPriceProps {
  paise: number;
  /** Font size of the amount. */
  size: number;
}

/** A cloth's price per meter: the amount large and blue, "/ meter" beside it. */
export const ClothPrice: React.FC<ClothPriceProps> = ({ paise, size }) => (
  <Text numberOfLines={1} style={[styles.price, { fontSize: size }]}>
    {formatRupees(paise)}
    <Text style={styles.unit}> {t('/ meter')}</Text>
  </Text>
);

const styles = themedStyles(() => ({
  price: {
    fontFamily: FONT.extrabold,
    fontVariant: ['tabular-nums'],
    color: COLORS.accent,
  },
  unit: { ...TYPE.label, color: COLORS.textSecondary },
}));
