import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import { PaymentQrSheet } from '../components/PaymentQrSheet';
import { Section } from '../components/Section';
import { TextField } from '../components/TextField';
import { COLORS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { usePagePadding } from '../layout/Page';
import { FORM_MAX_WIDTH } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import {
  billRepo,
  pendingPaise,
  type BillSummary,
} from '../repositories/billRepo';
import { customerLabel } from '../utils/customer';
import { haptics } from '../utils/haptics';
import { RUPEE_LIMITS } from '../utils/inputFilters';
import { formatRupees, paiseToInput, parseRupees } from '../utils/money';

export const CollectPaymentScreen: React.FC<
  RootScreenProps<'CollectPayment'>
> = ({ navigation, route }) => {
  const { billId } = route.params;
  const pagePadding = usePagePadding({ footer: true });
  const [bill, setBill] = useState<BillSummary | null>(null);
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showingQr, setShowingQr] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    billRepo
      .get(billId)
      .then((loaded) => {
        if (!active) return;
        if (!loaded) throw new Error('Bill not found');
        setBill(loaded);
        // Most customers settle the whole balance, so that is the default.
        setAmount(paiseToInput(pendingPaise(loaded)));
      })
      .catch(() => {
        if (!active) return;
        Alert.alert(t('Bill not found'), t('Go back and open the bill again.'));
        navigation.goBack();
      });
    return () => {
      active = false;
    };
  }, [billId, navigation]);

  if (!bill) {
    return (
      <View style={styles.page}>
        <ActivityIndicator color={COLORS.accent} style={styles.loading} />
      </View>
    );
  }

  const due = pendingPaise(bill);
  const paise = parseRupees(amount);
  const error = !submitted
    ? undefined
    : paise === null || paise === 0
      ? t('Enter the amount received')
      : paise > due
        ? t('More than the {0} due', formatRupees(due))
        : undefined;

  // The code carries what is typed when that is a sensible payment, so a
  // customer paying part of it scans for exactly that part; otherwise the
  // whole balance.
  const qrAmount = paise !== null && paise > 0 && paise <= due ? paise : due;

  const handleSave = async (): Promise<void> => {
    setSubmitted(true);
    if (paise === null || paise === 0 || paise > due) {
      haptics.error();
      return;
    }
    Keyboard.dismiss();
    setSaving(true);
    try {
      await billRepo.addPayment(billId, paise);
      haptics.success();
      navigation.goBack();
    } catch {
      haptics.error();
      setSaving(false);
      Alert.alert(
        t('Not saved'),
        t('The payment could not be saved. Try again.')
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <KeyboardAwareScroll
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={pagePadding}
      >
        <View style={styles.column}>
          <Section title={t('Bill No. {0}', bill.id)}>
            <View style={styles.dueRow}>
              <Text style={styles.customer}>
                {customerLabel(bill.customerName)}
              </Text>
              <View style={styles.due}>
                <Text style={styles.dueLabel}>{t('Due')}</Text>
                <Text style={styles.dueAmount}>{formatRupees(due)}</Text>
              </View>
            </View>
            <TextField
              label={t('Amount received')}
              prefix="₹ "
              value={amount}
              onChangeText={setAmount}
              error={error}
              decimal={RUPEE_LIMITS}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <Button
              label={t('Show QR to customer')}
              icon="qr-code-outline"
              variant="tonal"
              onPress={() => setShowingQr(true)}
            />
          </Section>
        </View>
      </KeyboardAwareScroll>

      <Footer maxWidth={FORM_MAX_WIDTH}>
        <Button
          label={t('Save payment')}
          icon="checkmark"
          onPress={handleSave}
          loading={saving}
        />
      </Footer>

      <PaymentQrSheet
        amountPaise={showingQr ? qrAmount : null}
        customerName={customerLabel(bill.customerName)}
        billId={bill.id}
        onClose={() => setShowingQr(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  column: { width: '100%', maxWidth: FORM_MAX_WIDTH, alignSelf: 'center' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customer: { ...TYPE.heading, flex: 1, color: COLORS.textPrimary },
  due: { alignItems: 'flex-end' },
  dueLabel: { ...TYPE.caption, color: COLORS.textSecondary },
  dueAmount: { ...TYPE.price, fontSize: 18, color: COLORS.warning },
}));
