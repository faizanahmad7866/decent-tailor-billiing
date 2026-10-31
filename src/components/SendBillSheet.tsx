import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { later, t } from '../i18n/t';
import { sendBillMessage, shareBill, shareBillText } from '../print/printBill';
import type { Bill } from '../repositories/billRepo';
import { haptics } from '../utils/haptics';
import { formatMobile, messagingNumber } from '../utils/phone';
import { Button } from './Button';
import { Tap } from './Tap';

type Way = 'pdf' | 'whatsapp' | 'sms' | 'text';

interface SendBillSheetProps {
  /** The bill to send; the sheet is closed while there is none. */
  bill: Bill | null;
  visible: boolean;
  onClose: () => void;
}

interface WayOption {
  way: Way;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const pdfWay = (): WayOption => ({
  way: 'pdf',
  icon: 'document-text-outline',
  title: t('Send as PDF'),
  subtitle: t('The printed bill as a file, to WhatsApp, Gmail or Drive'),
});

/**
 * The ways a bill can go. With a mobile number on it the message goes
 * straight to that number — WhatsApp or SMS — with nothing to pick; without
 * one, the share sheet asks who to send it to.
 */
function waysFor(bill: Bill | null): WayOption[] {
  if (!bill || !messagingNumber(bill.customerMobile)) {
    return [
      pdfWay(),
      {
        way: 'text',
        icon: 'chatbubble-ellipses-outline',
        title: t('Send as message'),
        subtitle: t('No mobile number on this bill — choose who to send it to'),
      },
    ];
  }
  const to = t('Straight to {0}', formatMobile(bill.customerMobile ?? ''));
  return [
    {
      way: 'whatsapp',
      icon: 'logo-whatsapp',
      title: t('Send on WhatsApp'),
      subtitle: to,
    },
    {
      way: 'sms',
      icon: 'chatbubble-outline',
      title: t('Send as SMS'),
      subtitle: to,
    },
    pdfWay(),
  ];
}

// What to tell the tailor when a way fails, in the way's own terms.
const FAILURE: Record<Way, string> = {
  pdf: later('Something went wrong while preparing the bill. Try again.'),
  text: later('Something went wrong while preparing the bill. Try again.'),
  whatsapp: later(
    'WhatsApp could not be opened. Check that it is installed, or send the bill as SMS.'
  ),
  sms: later(
    'The messages app could not be opened. Try WhatsApp or the PDF instead.'
  ),
};

/**
 * How to send a bill to the customer: as a PDF or as a text message. Opened
 * from the bill's Send button; Cancel and the back button simply close it.
 */
export const SendBillSheet: React.FC<SendBillSheetProps> = ({
  bill,
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<Way | null>(null);

  const send = async (way: Way): Promise<void> => {
    if (!bill || busy) return;
    setBusy(way);
    try {
      if (way === 'pdf') await shareBill(bill);
      else if (way === 'text') await shareBillText(bill);
      else await sendBillMessage(bill, way);
      onClose();
    } catch {
      haptics.error();
      Alert.alert(t('Bill not sent'), t(FAILURE[way]));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      visible={visible && bill !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={busy ? undefined : onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={busy ? undefined : onClose}
          accessibilityLabel={t('Close')}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('Send bill')}
            </Text>
            <Text style={styles.subtitle}>
              {bill?.customerName.trim()
                ? t('Choose how to send it to {0}.', bill.customerName.trim())
                : t('Choose how to send it.')}
            </Text>
          </View>

          <View style={styles.ways}>
            {waysFor(bill).map(({ way, icon, title, subtitle }) => (
              <Tap
                key={way}
                onPress={() => send(way)}
                disabled={busy !== null}
                accessibilityLabel={title}
                style={[styles.way, busy && busy !== way && styles.dimmed]}
              >
                <View style={styles.wayIcon}>
                  {busy === way ? (
                    <ActivityIndicator color={COLORS.accent} />
                  ) : (
                    <Ionicons name={icon} size={24} color={COLORS.accent} />
                  )}
                </View>
                <View style={styles.wayText}>
                  <Text style={styles.wayTitle}>{title}</Text>
                  <Text style={styles.waySubtitle}>{subtitle}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textMuted}
                />
              </Tap>
            ))}
          </View>

          <Button
            label={t('Cancel')}
            variant="secondary"
            onPress={onClose}
            disabled={busy !== null}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = themedStyles(() => ({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.backdrop,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 20,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  header: { alignItems: 'center', gap: 6 },
  title: { ...TYPE.title, fontSize: 21, color: COLORS.textPrimary },
  subtitle: {
    ...TYPE.body,
    lineHeight: 21,
    textAlign: 'center',
    color: COLORS.textSecondary,
    maxWidth: 360,
  },
  ways: { gap: 10 },
  way: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
  },
  dimmed: { opacity: 0.5 },
  wayIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
  },
  wayText: { flex: 1, gap: 2 },
  wayTitle: { ...TYPE.bodyStrong, fontSize: 16, color: COLORS.textPrimary },
  waySubtitle: { ...TYPE.caption, lineHeight: 17, color: COLORS.textSecondary },
}));
