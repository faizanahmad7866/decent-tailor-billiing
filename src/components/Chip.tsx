import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { Tap } from './Tap';

interface ChipProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** A picture shown in a small round frame in place of the icon. */
  leading?: React.ReactNode;
  /** Defaults to "Add {label}". */
  accessibilityLabel?: string;
}

/** A small rounded button for quick picks, like a garment to add. */
export const Chip: React.FC<ChipProps> = ({
  label,
  onPress,
  icon = 'add',
  leading,
  accessibilityLabel = t('Add {0}', label),
}) => (
  <Tap
    onPress={onPress}
    throttle={false}
    accessibilityLabel={accessibilityLabel}
    style={[styles.chip, leading ? styles.withLeading : null]}
  >
    {leading ? (
      <View style={styles.leading}>{leading}</View>
    ) : (
      <Ionicons name={icon} size={16} color={COLORS.accent} />
    )}
    <Text style={styles.label}>{label}</Text>
  </Tap>
);

const styles = themedStyles(() => ({
  chip: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryTint,
  },
  // The frame sits close to the chip's rounded end, like an avatar.
  withLeading: { paddingLeft: 5 },
  leading: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  label: { ...TYPE.label, fontSize: 14, color: COLORS.textPrimary },
}));
