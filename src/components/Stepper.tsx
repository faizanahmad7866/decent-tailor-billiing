import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { Tap } from './Tap';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  /** What is being counted, for screen readers: "Shirt quantity". */
  label: string;
  min?: number;
  max?: number;
}

/** − 2 + : a small whole number, changed one at a time. */
export const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  label,
  min = 1,
  max = 99,
}) => {
  const step = (by: -1 | 1): React.ReactNode => {
    const atLimit = by < 0 ? value <= min : value >= max;
    return (
      <Tap
        onPress={() => onChange(value + by)}
        disabled={atLimit}
        haptic="select"
        throttle={false}
        accessibilityLabel={
          by < 0 ? t('Decrease {0}', label) : t('Increase {0}', label)
        }
        style={[styles.button, atLimit && styles.disabled]}
      >
        <Ionicons
          name={by < 0 ? 'remove' : 'add'}
          size={20}
          color={COLORS.accent}
        />
      </Tap>
    );
  };

  return (
    <View style={styles.stepper} accessibilityLabel={`${label}: ${value}`}>
      {step(-1)}
      <Text style={styles.value}>{value}</Text>
      {step(1)}
    </View>
  );
};

const styles = themedStyles(() => ({
  stepper: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  button: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.3 },
  value: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    minWidth: 28,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
}));
