import React from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { Tap } from './Tap';

interface HeaderActionProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

/** A labelled action at the right end of the header: pencil + "Edit". */
export const HeaderAction: React.FC<HeaderActionProps> = ({
  label,
  icon,
  onPress,
}) => (
  <Tap onPress={onPress} accessibilityLabel={label} style={styles.action}>
    <Ionicons name={icon} size={18} color={COLORS.textPrimary} />
    <Text style={styles.label}>{label}</Text>
  </Tap>
);

const styles = themedStyles(() => ({
  action: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryTint,
  },
  label: { ...TYPE.label, fontSize: 14, color: COLORS.textPrimary },
}));
