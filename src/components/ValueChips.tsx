import React from 'react';
import { Text, View } from 'react-native';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { Tap } from './Tap';

interface ValueChipsProps {
  options: readonly { key: string; label: string; selected: boolean }[];
  onPick: (key: string) => void;
  /** Read aloud with the chip's label: "meters", "extra per meter". */
  describes: string;
}

/**
 * A row of ready-made values to tap instead of typing: the one matching what
 * is in the field stands filled, the rest outlined. Tapping is `onPick`'s
 * business — a chip may set a value or, tapped again, clear it.
 */
export const ValueChips: React.FC<ValueChipsProps> = ({
  options,
  onPick,
  describes,
}) => (
  <View style={styles.row}>
    {options.map((option) => (
      <Tap
        key={option.key}
        onPress={() => onPick(option.key)}
        haptic="select"
        throttle={false}
        accessibilityRole="button"
        accessibilityState={{ selected: option.selected }}
        accessibilityLabel={`${option.label} ${describes}`}
        style={[styles.chip, option.selected && styles.selected]}
      >
        <Text style={[styles.label, option.selected && styles.selectedLabel]}>
          {option.label}
        </Text>
      </Tap>
    ))}
  </View>
);

const styles = themedStyles(() => ({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: 56,
    height: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  selected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  label: {
    ...TYPE.label,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  selectedLabel: { color: COLORS.onPrimary },
}));
