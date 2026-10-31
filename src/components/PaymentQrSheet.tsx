import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { upiPaymentLink } from '../print/upiQr';
import { formatRupees } from '../utils/money';
import { Button } from './Button';
import { QrCode } from './QrCode';

const QR_SIZE = 260;

interface PaymentQrSheetProps {
  /** What the customer is to pay; the sheet is shut while this is null. */
  amountPaise: number | null;
  customerName: string;
  billId: number;
  onClose: () => void;
}

/**
 * The shop's UPI code with the amount already in it, held up for the
 * customer to scan — the tailor's phone is the counter. Laid out for the
 * person on the other side: what they pay, the code, and whose account it
 * lands in. Nothing here talks to a payment service: the customer's own app
 * pays the shop's bank directly, and the tailor still records the payment.
 */
export const PaymentQrSheet: React.FC<PaymentQrSheetProps> = ({
  amountPaise,
  customerName,
  billId,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const link = useMemo(
    () =>
      amountPaise === null
        ? null
        : upiPaymentLink(amountPaise, `Bill ${billId}`),
    [amountPaise, billId]
  );

  return (
    <Modal
      visible={link !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('Close')}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <Text style={styles.label}>{t('Scan to pay')}</Text>
          <Text style={styles.amount}>
            {amountPaise === null ? '' : formatRupees(amountPaise)}
          </Text>
          <Text style={styles.for}>
            {t('{0} · Bill No. {1}', customerName, billId)}
          </Text>

          <View style={styles.codeFrame}>
            {link ? <QrCode text={link} size={QR_SIZE} /> : null}
          </View>

          <Text style={styles.payee}>{t('Pay with any UPI app')}</Text>
          <Text style={styles.note}>
            {t(
              'After they pay, save it with Save payment so the bill shows it.'
            )}
          </Text>
          <Button label={t('Done')} variant="secondary" onPress={onClose} />
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
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 6,
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
    marginBottom: 14,
  },
  label: {
    ...TYPE.overline,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  amount: {
    ...TYPE.display,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  for: { ...TYPE.body, textAlign: 'center', color: COLORS.textSecondary },
  codeFrame: {
    alignSelf: 'center',
    marginVertical: 18,
    padding: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.qrLight,
  },
  payee: { ...TYPE.label, textAlign: 'center', color: COLORS.textPrimary },
  note: {
    ...TYPE.caption,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
}));
