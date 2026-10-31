import React from 'react';
import { Text, View } from 'react-native';
import { COLORS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { formatRupees } from '../../utils/money';

interface LineRowProps {
  title: string;
  /** A second name under the title, the same size — a cloth's Hindi. */
  subtitle?: string | null;
  detail: string;
  paise?: number;
}

/**
 * One line of a bill, the way an invoice lists it: what it is, how it was
 * worked out beneath, and what it came to on the right.
 */
export const LineRow: React.FC<LineRowProps> = ({
  title,
  subtitle,
  detail,
  paise,
}) => (
  <View style={styles.line}>
    <View style={styles.text}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.title}>{subtitle}</Text> : null}
      <Text style={styles.detail}>{detail}</Text>
    </View>
    {paise !== undefined ? (
      <Text style={styles.amount}>{formatRupees(paise)}</Text>
    ) : null}
  </View>
);

const styles = themedStyles(() => ({
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  text: { flex: 1, gap: 2 },
  title: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  detail: {
    ...TYPE.body,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  amount: { ...TYPE.price, color: COLORS.textPrimary },
}));
