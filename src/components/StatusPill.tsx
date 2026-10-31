import React from 'react';
import { Text } from 'react-native';
import { COLORS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { formatRupees } from '../utils/money';

interface StatusPillProps {
  pendingPaise: number;
}

/** "Paid" in green, or what is still owed in orange: "₹1,225 due". */
export const StatusPill: React.FC<StatusPillProps> = ({ pendingPaise }) => {
  const paid = pendingPaise <= 0;
  return (
    <Text style={[styles.label, paid ? styles.paid : styles.due]}>
      {paid ? t('Paid') : t('{0} due', formatRupees(pendingPaise))}
    </Text>
  );
};

const styles = themedStyles(() => ({
  label: { ...TYPE.section, fontVariant: ['tabular-nums'] },
  paid: { color: COLORS.success },
  due: { color: COLORS.warning },
}));
