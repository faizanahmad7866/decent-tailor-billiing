import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { BillDocument } from '../components/bill/BillDocument';
import { CustomerActions } from '../components/bill/CustomerActions';
import { LineRow } from '../components/bill/LineRow';
import { EmptyState } from '../components/EmptyState';
import { Footer } from '../components/Footer';
import { HeaderAction } from '../components/HeaderAction';
import { QrCode } from '../components/QrCode';
import { Section } from '../components/Section';
import { SendBillSheet } from '../components/SendBillSheet';
import { LABEL } from '../constants/labels';
import { COLORS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { shownDateTime } from '../i18n/dates';
import { t } from '../i18n/t';
import { PageColumn, PageColumns, usePagePadding } from '../layout/Page';
import { useLayout } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import { upiPaymentLink } from '../print/upiQr';
import { billRepo, pendingPaise, type Bill } from '../repositories/billRepo';
import { customerLabel } from '../utils/customer';
import { haptics } from '../utils/haptics';
import { formatRupees } from '../utils/money';

const QR_SIZE = 180;

export const BillDetailScreen: React.FC<RootScreenProps<'BillDetail'>> = ({
  navigation,
  route,
}) => {
  const pagePadding = usePagePadding({ footer: true });
  const { isTablet, pageMaxWidth } = useLayout();
  const { billId } = route.params;
  const [bill, setBill] = useState<Bill | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  // Edit sits in the header, where it can't be mistaken for Collect or Send.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderAction
          label={t('Edit')}
          icon="create-outline"
          onPress={() => navigation.navigate('NewBill', { billId })}
        />
      ),
    });
  }, [navigation, billId]);

  const [deleting, setDeleting] = useState(false);
  const [sending, setSending] = useState(false);

  // Reloaded on return from Collect payment, so the balance is current.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      billRepo.get(billId).then(
        (loaded) => {
          if (!active) return;
          setBill(loaded);
          setLoadFailed(!loaded);
        },
        () => {
          if (active) setLoadFailed(true);
        }
      );
      return () => {
        active = false;
      };
    }, [billId, loadAttempt])
  );

  if (!bill) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t("Couldn't open this bill")}
            message={t(
              'Something went wrong while reading it. Your data is safe — try again.'
            )}
            action={{
              label: t('Try again'),
              onPress: () => setLoadAttempt((attempt) => attempt + 1),
            }}
          />
        ) : (
          <ActivityIndicator color={COLORS.accent} style={styles.loading} />
        )}
      </View>
    );
  }

  const pending = pendingPaise(bill);

  // Deleting is final, so it asks first and says what goes with the bill.
  const handleDelete = (): void => {
    const paidNote = bill.paidPaise
      ? t(
          '\n\nThe {0} paid on it is removed from your records too.',
          formatRupees(bill.paidPaise)
        )
      : '';
    Alert.alert(
      t('Delete Bill No. {0}?', bill.id),
      t(
        '{0} · {1}{2}\n\nThis cannot be undone.',
        customerLabel(bill.customerName),
        formatRupees(bill.totalPaise),
        paidNote
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await billRepo.remove(bill.id);
              haptics.success();
              navigation.goBack();
            } catch {
              haptics.error();
              setDeleting(false);
              Alert.alert(
                t('Not deleted'),
                t('The bill could not be deleted. Try again.')
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={pagePadding}>
        <PageColumn wide>
          <PageColumns
            first={<BillDocument bill={bill} />}
            second={
              <>
                <CustomerActions bill={bill} />

                <Section title={t(LABEL.payments)}>
                  {bill.payments.length ? (
                    bill.payments.map((payment) => (
                      <LineRow
                        key={payment.id}
                        title={formatRupees(payment.amountPaise)}
                        detail={shownDateTime(payment.createdAt)}
                      />
                    ))
                  ) : (
                    <Text style={styles.noPayments}>
                      {t('No payment taken yet.')}
                    </Text>
                  )}
                </Section>

                {/* Only while money is due, carrying exactly what is due — the
                    same code the printed bill has, ready to turn round to the
                    customer. */}
                {pending > 0 ? (
                  <Section title={t(LABEL.scanToPay)}>
                    <View style={styles.pay}>
                      <Text style={styles.payAmount}>
                        {formatRupees(pending)}
                      </Text>
                      <View style={styles.qrFrame}>
                        <QrCode
                          text={upiPaymentLink(pending, `Bill ${bill.id}`)}
                          size={QR_SIZE}
                        />
                      </View>
                      <Text style={styles.payee}>
                        {t('Pay with any UPI app')}
                      </Text>
                      <Text style={styles.payNote}>
                        {t('Once paid, tap Collect to record it on this bill.')}
                      </Text>
                    </View>
                  </Section>
                ) : null}

                <Button
                  label={t('Delete bill')}
                  icon="trash-outline"
                  variant="danger"
                  onPress={handleDelete}
                  loading={deleting}
                />
              </>
            }
          />
        </PageColumn>
      </ScrollView>

      <Footer maxWidth={pageMaxWidth}>
        <View style={isTablet ? styles.outputs : styles.actions}>
          {pending > 0 ? (
            <Button
              label={t('Collect {0}', formatRupees(pending))}
              icon="wallet-outline"
              onPress={() => navigation.navigate('CollectPayment', { billId })}
              style={isTablet ? styles.output : undefined}
            />
          ) : null}
          <View style={[styles.outputs, isTablet && styles.output]}>
            <Button
              label={t('Print')}
              icon="print-outline"
              variant={pending > 0 ? 'secondary' : 'primary'}
              onPress={() => navigation.navigate('PrintBill', { billId })}
              style={styles.output}
            />
            <Button
              label={t('Send')}
              icon="paper-plane-outline"
              variant="secondary"
              onPress={() => setSending(true)}
              style={styles.output}
            />
          </View>
        </View>
      </Footer>

      <SendBillSheet
        bill={bill}
        visible={sending}
        onClose={() => setSending(false)}
      />
    </View>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  noPayments: { ...TYPE.body, color: COLORS.textSecondary },
  pay: { alignItems: 'center', gap: 4 },
  payAmount: { ...TYPE.display, color: COLORS.textPrimary },
  qrFrame: {
    marginVertical: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.qrLight,
  },
  payee: { ...TYPE.label, textAlign: 'center', color: COLORS.textPrimary },
  payNote: {
    ...TYPE.caption,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  actions: { gap: 10 },
  outputs: { flexDirection: 'row', gap: 12 },
  output: { flex: 1 },
}));
