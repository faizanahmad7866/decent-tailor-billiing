import React from 'react';
import { Text, View } from 'react-native';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { Tap } from './Tap';

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A few mutually exclusive choices side by side: ₹ | %, All | Pending | Paid. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <View style={styles.track} accessibilityRole="tablist">
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
            accessibilityLabel={option.label}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, selected && styles.selectedLabel]}
            >
              {option.label}
            </Text>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = themedStyles(() => ({
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSunken,
  },
  segment: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  selected: { backgroundColor: COLORS.surface, ...CARD },
  label: { ...TYPE.label, fontSize: 14, color: COLORS.textSecondary },
  selectedLabel: { color: COLORS.accent },
}));
