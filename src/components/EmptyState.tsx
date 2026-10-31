import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

/**
 * What a page shows when it has nothing to list, or couldn't load: what
 * happened, in a sentence, and the one thing to do next.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
}) => (
  <View style={styles.container}>
    <View style={styles.badge}>
      <Ionicons name={icon} size={32} color={COLORS.accent} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {action ? (
      <Button
        label={action.label}
        onPress={action.onPress}
        style={styles.action}
      />
    ) : null}
  </View>
);

const styles = themedStyles(() => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
    marginBottom: 20,
  },
  title: {
    ...TYPE.title,
    fontSize: 21,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 320,
  },
  action: { marginTop: 28, minWidth: 220 },
}));
