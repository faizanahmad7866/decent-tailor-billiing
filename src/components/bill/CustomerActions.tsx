import React from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { dialUrl, paymentReminderUrl } from '../../print/paymentReminder';
import { pendingPaise, type BillSummary } from '../../repositories/billRepo';
import { haptics } from '../../utils/haptics';
import { Button } from '../Button';
import { Tap } from '../Tap';

interface CustomerActionsProps {
  bill: BillSummary;
  /** Small buttons for a row of the Bills list, Collect among them. */
  compact?: boolean;
  /** Icons alone, for the end of a tablet's table row. */
  iconsOnly?: boolean;
  onCollect?: () => void;
}

function open(url: string, title: string, message: string): void {
  Linking.openURL(url).catch(() => {
    haptics.error();
    Alert.alert(title, message);
  });
}

/**
 * Reaching the customer about a bill: a call straight to the number on it, and
 * — while money is due — a payment reminder on WhatsApp, opened on their chat
 * with the words written in, for the tailor to press send. A bill with no
 * number has nothing to reach them on, and says so on its own page.
 */
export const CustomerActions: React.FC<CustomerActionsProps> = ({
  bill,
  compact = false,
  iconsOnly = false,
  onCollect,
}) => {
  const callUrl = dialUrl(bill.customerMobile);
  const due = pendingPaise(bill) > 0;
  const reminderUrl = due ? paymentReminderUrl(bill) : null;

  const call = (): void => {
    if (callUrl) {
      open(
        callUrl,
        t('Cannot place the call'),
        t('No phone app could be opened on this device.')
      );
    }
  };
  const remind = (): void => {
    if (reminderUrl) {
      open(
        reminderUrl,
        t('WhatsApp could not be opened'),
        t('Check that it is installed, then try again.')
      );
    }
  };

  if (compact) {
    return (
      <View style={iconsOnly ? styles.iconRow : styles.row}>
        {onCollect ? (
          <Pill
            icon="wallet-outline"
            label={t('Collect')}
            onPress={onCollect}
            iconOnly={iconsOnly}
            accessibilityLabel={t('Collect payment on bill {0}', bill.id)}
          />
        ) : null}
        {callUrl ? (
          <Pill
            icon="call-outline"
            label={t('Call')}
            onPress={call}
            iconOnly={iconsOnly}
            accessibilityLabel={t('Call the customer of bill {0}', bill.id)}
          />
        ) : null}
        {reminderUrl ? (
          <Pill
            icon="logo-whatsapp"
            label={t('Remind')}
            onPress={remind}
            iconOnly={iconsOnly}
            accessibilityLabel={t(
              'Send a payment reminder for bill {0}',
              bill.id
            )}
          />
        ) : null}
      </View>
    );
  }

  if (!callUrl) {
    return due ? (
      <Text style={styles.noNumber}>
        {t(
          'No mobile number on this bill. Add one with Edit to call the customer or send a payment reminder.'
        )}
      </Text>
    ) : null;
  }
  return (
    <View style={styles.row}>
      <Button
        label={t('Call')}
        icon="call-outline"
        variant="secondary"
        onPress={call}
        style={styles.action}
      />
      {reminderUrl ? (
        <Button
          label={t('Remind')}
          icon="logo-whatsapp"
          variant="secondary"
          onPress={remind}
          style={styles.action}
        />
      ) : null}
    </View>
  );
};

const Pill: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconOnly: boolean;
  accessibilityLabel: string;
}> = ({ icon, label, onPress, iconOnly, accessibilityLabel }) => (
  <Tap
    onPress={onPress}
    accessibilityLabel={accessibilityLabel}
    style={[styles.pill, iconOnly ? styles.pillSquare : styles.pillGrow]}
  >
    <Ionicons name={icon} size={16} color={COLORS.accent} />
    {iconOnly ? null : (
      <Text numberOfLines={1} style={styles.pillLabel}>
        {label}
      </Text>
    )}
  </Tap>
);

const styles = themedStyles(() => ({
  row: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
  iconRow: { flexDirection: 'row', gap: 6 },
  pill: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  pillGrow: { flex: 1 },
  pillSquare: { width: 36 },
  pillLabel: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  noNumber: {
    fontFamily: FONT.medium,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
}));
