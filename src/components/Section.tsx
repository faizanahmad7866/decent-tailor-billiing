import React from 'react';
import { Text, View } from 'react-native';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';

interface SectionProps {
  title: string;
  /** The section's place in a form filled top to bottom (New Bill): "1. Customer". */
  step?: number;
  /** One quiet line under the title saying what the section is for. */
  description?: string;
  /** Sits at the right of the title — a count, a total, an action. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * One step of a form, or one part of a page: a white surface whose heading sits
 * on a grey band, ruled off from the content — the way a form or a ledger
 * groups a page, so every part reads as one self-contained block.
 */
export const Section: React.FC<SectionProps> = ({
  title,
  step,
  description,
  aside,
  children,
}) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={styles.title}>
          {step !== undefined ? `${step}. ` : ''}
          {title}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {aside}
    </View>
    <View style={styles.body}>{children}</View>
  </View>
);

const styles = themedStyles(() => ({
  card: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...CARD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleBlock: { flex: 1, gap: 1 },
  // TYPE.section, not heading: the titles carry Hindi, which letter-spacing
  // breaks apart on Android.
  title: { ...TYPE.section, fontSize: 14, color: COLORS.textPrimary },
  description: { ...TYPE.caption, color: COLORS.textSecondary },
  body: { padding: 14, gap: 14 },
}));
