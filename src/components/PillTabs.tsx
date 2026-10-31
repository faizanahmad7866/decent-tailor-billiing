import React from 'react';
import { Text, View } from 'react-native';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { Tap } from './Tap';

interface PillTabsProps<T extends string> {
  options: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of filters: the chosen one filled blue, the rest white. */
export function PillTabs<T extends string>({
  options,
  value,
  onChange,
}: PillTabsProps<T>): React.JSX.Element {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Tap
            key={option.value}
            onPress={() => onChange(option.value)}
            haptic="select"
            throttle={false}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}${option.count === undefined ? '' : `, ${option.count}`}`}
            style={[styles.pill, selected ? styles.selected : styles.idle]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {option.label}
            </Text>
            {option.count === undefined ? null : (
              <View style={[styles.count, selected && styles.selectedCount]}>
                <Text
                  style={[styles.countLabel, selected && styles.selectedLabel]}
                >
                  {option.count}
                </Text>
              </View>
            )}
          </Tap>
        );
      })}
    </View>
  );
}

const styles = themedStyles(() => ({
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: RADIUS.pill,
  },
  idle: { backgroundColor: COLORS.surface, ...CARD },
  selected: { backgroundColor: COLORS.primary },
  label: { ...TYPE.label, fontSize: 14, color: COLORS.textSecondary },
  selectedLabel: { color: COLORS.onPrimary },
  count: {
    minWidth: 24,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSunken,
  },
  selectedCount: { backgroundColor: COLORS.onPrimaryTile },
  countLabel: { ...TYPE.caption, color: COLORS.textSecondary },
}));
