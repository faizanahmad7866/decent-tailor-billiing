import React from 'react';
import { Text, View } from 'react-native';
import { CARD, COLORS, FONT, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { COLLECT_MONTHS, type CollectMonths } from '../utils/dateRange';
import { Tap } from './Tap';

interface CollectPeriodPickerProps {
  value: CollectMonths;
  onChange: (months: CollectMonths) => void;
}

const options = (): readonly {
  value: CollectMonths;
  label: string;
  spoken: string;
}[] => [
  ...COLLECT_MONTHS.map((months) => ({
    value: months,
    label: t('{0} mo', months),
    spoken: t('Last {0} months', months),
  })),
  { value: null, label: t('All'), spoken: t('All bills') },
];

/**
 * Chooses how far back the To collect total looks: 2, 4 or 6 months, or all
 * bills. The choice is the caller's to keep.
 */
export const CollectPeriodPicker: React.FC<CollectPeriodPickerProps> = ({
  value,
  onChange,
}) => (
  <View style={styles.row}>
    <Text style={styles.caption}>{t('Period')}</Text>
    <View style={styles.options} accessibilityRole="tablist">
      {options().map((option) => {
        const selected = option.value === value;
        return (
          <Tap
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            haptic="select"
            throttle={false}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.spoken}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {option.label}
            </Text>
          </Tap>
        );
      })}
    </View>
  </View>
);

const styles = themedStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  caption: { ...TYPE.caption, color: COLORS.textSecondary },
  options: {
    flex: 1,
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryTint,
  },
  option: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
  },
  selected: { backgroundColor: COLORS.surface, ...CARD },
  label: { ...TYPE.label, color: COLORS.textSecondary },
  selectedLabel: { fontFamily: FONT.semibold, color: COLORS.textPrimary },
}));
