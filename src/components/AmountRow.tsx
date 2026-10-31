import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { formatRupees } from '../utils/money';

interface AmountRowProps {
  label: string;
  paise: number;
  /** Shown as a deduction: −₹200. */
  negative?: boolean;
  /** The bill's total: larger, and ruled off from the lines above. */
  emphasis?: boolean;
}

/** One line of a bill's totals: label on the left, amount on the right. */
export const AmountRow: React.FC<AmountRowProps> = ({
  label,
  paise,
  negative = false,
  emphasis = false,
}) => (
  <View style={[styles.row, emphasis && styles.emphasisRow]}>
    <Text style={[styles.label, emphasis && styles.emphasisText]}>{label}</Text>
    <Text style={[styles.amount, emphasis && styles.emphasisText]}>
      {negative ? `−${formatRupees(paise)}` : formatRupees(paise)}
    </Text>
  </View>
);

const styles = themedStyles(() => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  emphasisRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  label: { ...TYPE.body, color: COLORS.textSecondary },
  amount: {
    ...TYPE.price,
    fontFamily: FONT.semibold,
    color: COLORS.textPrimary,
  },
  emphasisText: {
    fontFamily: FONT.extrabold,
    fontSize: 19,
    color: COLORS.textPrimary,
  },
}));
