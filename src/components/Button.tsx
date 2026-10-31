import React from 'react';
import {
  ActivityIndicator,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { Tap } from './Tap';

type Variant = 'primary' | 'secondary' | 'tonal' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Shows a spinner and ignores presses while work is under way. */
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// primary: the one main action of a page. secondary: any other action.
// tonal: a softer main action. danger: removes something.
const tones = (): Record<
  Variant,
  { background: string; text: string; border?: string }
> => ({
  primary: { background: COLORS.primary, text: COLORS.onPrimary },
  secondary: {
    background: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.borderStrong,
  },
  tonal: { background: COLORS.primaryTint, text: COLORS.textPrimary },
  danger: { background: COLORS.dangerTint, text: COLORS.danger },
});

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}) => {
  const tone = tones()[variant];
  const inactive = disabled || loading;

  return (
    <Tap
      onPress={onPress}
      disabled={inactive}
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        { backgroundColor: tone.background },
        tone.border ? { borderWidth: 1, borderColor: tone.border } : null,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={tone.text} /> : null}
          <Text numberOfLines={1} style={[styles.label, { color: tone.text }]}>
            {label}
          </Text>
        </>
      )}
    </Tap>
  );
};

const styles = themedStyles(() => ({
  button: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabled: { opacity: 0.45 },
  label: { ...TYPE.bodyStrong },
}));
