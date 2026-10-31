import React from 'react';
import {} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { Tap } from './Tap';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  /** Read aloud by screen readers — the button has no visible words. */
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

/** A 48dp round target around a single icon, for header and card actions. */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  onPress,
  color = COLORS.textPrimary,
  disabled,
}) => (
  <Tap
    onPress={onPress}
    disabled={disabled}
    accessibilityLabel={label}
    style={[styles.button, disabled && styles.disabled]}
  >
    <Ionicons name={icon} size={22} color={color} />
  </Tap>
);

const styles = themedStyles(() => ({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
}));
