import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { PrintProblemNotice } from '../components/PrintProblemNotice';
import { PrinterList } from '../components/PrinterList';
import { Section } from '../components/Section';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { later, t } from '../i18n/t';
import { usePagePadding } from '../layout/Page';
import { FORM_MAX_WIDTH } from '../layout/useLayout';
import { usePrinter } from '../hooks/usePrinter';
import {
  connectionKind,
  toPrinterError,
  type BluetoothDevice,
  type PrintProblem,
} from '../print/bluetoothPrint';
import { printTestPage } from '../print/printBill';
import { haptics } from '../utils/haptics';

const SETUP_STEPS = [
  later('Switch the printer on and load the 58 mm paper roll.'),
  later('Tap Search for printers above and keep the printer near the phone.'),
  later(
    'Tap your printer when it shows up. If Android asks to pair, enter 0000 or 1234.'
  ),
  later('When it says Connected, print a test page.'),
];

type Test =
  | { kind: 'idle' }
  | { kind: 'printing' }
  | { kind: 'done' }
  | { kind: 'problem'; problem: PrintProblem };

/**
 * The shop's printer: which one bills go to, a test page to prove it works,
 * and how to set up a new one.
 */
export const PrinterSettingsScreen: React.FC = () => {
  const {
    printer,
    printerName,
    link,
    setLink,
    problem: linkProblem,
    connect,
    choose,
    forget,
  } = usePrinter();
  const pagePadding = usePagePadding();
  const [test, setTest] = useState<Test>({ kind: 'idle' });

  const select = (device: BluetoothDevice): void => {
    setTest({ kind: 'idle' });
    choose(device);
  };

  const runTest = async (): Promise<void> => {
    if (!printer) return;
    setTest({ kind: 'printing' });
    try {
      await printTestPage(printer);
      setLink('connected');
      haptics.success();
      setTest({ kind: 'done' });
    } catch (error) {
      const { problem } = toPrinterError(error);
      if (problem === 'connect' || problem === 'lost') setLink('failed');
      haptics.error();
      setTest({ kind: 'problem', problem });
    }
  };

  const confirmForget = (): void => {
    Alert.alert(
      t('Forget {0}?', printerName),
      t('Bills will ask which printer to use the next time you print.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Forget'),
          style: 'destructive',
          onPress: () => {
            forget();
            setTest({ kind: 'idle' });
          },
        },
      ]
    );
  };

  const statusNote = (): string => {
    if (!printer)
      return t('Pick one above and every bill prints to it with one tap.');
    if (link === 'connecting') return t('Connecting…');
    if (link === 'connected') {
      const kind = connectionKind();
      if (!kind) return t('Connected · ready to print');
      const over = kind === 'ble' ? 'BLE' : 'Bluetooth Classic';
      return t('Connected over {0} · ready to print', over);
    }
    if (link === 'failed') return t('Not connected — is it switched on?');
    return `Bluetooth · ${printer.address}`;
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={pagePadding}>
        <View style={styles.column}>
          <PrinterList
            selected={printer}
            link={link}
            onSelect={select}
            disabled={test.kind === 'printing'}
            autoSearch={!printer}
          />

          <Section title={t('Your printer')}>
            <View style={styles.printer}>
              <View style={styles.printerIcon}>
                <Ionicons
                  name={printer ? 'print' : 'bluetooth'}
                  size={26}
                  color={COLORS.accent}
                />
              </View>
              <View style={styles.printerText}>
                <Text style={styles.printerName} numberOfLines={1}>
                  {printer ? printerName : t('No printer chosen')}
                </Text>
                <Text
                  style={[
                    styles.printerNote,
                    link === 'connected' && styles.noteConnected,
                  ]}
                >
                  {statusNote()}
                </Text>
              </View>
            </View>

            {linkProblem && printer && test.kind !== 'problem' ? (
              <PrintProblemNotice
                problem={linkProblem}
                printerName={printerName}
                onRetry={() => void connect(printer)}
              />
            ) : null}
            {test.kind === 'problem' ? (
              <PrintProblemNotice
                problem={test.problem}
                printerName={printerName}
                onRetry={() => void runTest()}
              />
            ) : null}
            {test.kind === 'done' ? (
              <View style={styles.tested} accessibilityLiveRegion="polite">
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.success}
                />
                <Text style={styles.testedText}>
                  {t(
                    'Test page sent. If its text and QR printed, bills will print too.'
                  )}
                </Text>
              </View>
            ) : null}

            {printer ? (
              <>
                <Button
                  label={t('Print test page')}
                  icon="document-text-outline"
                  variant="tonal"
                  onPress={() => void runTest()}
                  loading={test.kind === 'printing'}
                />
                <Button
                  label={t('Forget printer')}
                  icon="close-circle-outline"
                  variant="danger"
                  onPress={confirmForget}
                  disabled={test.kind === 'printing'}
                />
              </>
            ) : null}
          </Section>

          <Section title={t('Set up a new printer')}>
            <View style={styles.steps}>
              {SETUP_STEPS.map((step, index) => (
                <View key={step} style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{t(step)}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Text style={styles.footnote}>
            {t(
              "Bills print as text in the printer's own font, with the payment QR, exactly as in the preview, on any 58 mm Bluetooth thermal printer. Names print in English, and ₹ as Rs."
            )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  column: {
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    gap: 16,
  },
  printer: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  printerIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
  },
  printerText: { flex: 1, gap: 2 },
  printerName: { ...TYPE.heading, color: COLORS.textPrimary },
  printerNote: { ...TYPE.caption, lineHeight: 17, color: COLORS.textSecondary },
  noteConnected: { color: COLORS.success },
  tested: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.successTint,
  },
  testedText: { ...TYPE.label, flex: 1, color: COLORS.success },
  steps: { gap: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
  },
  stepNumberText: { ...TYPE.label, color: COLORS.accent },
  stepText: {
    ...TYPE.body,
    flex: 1,
    lineHeight: 21,
    color: COLORS.textPrimary,
  },
  footnote: {
    ...TYPE.caption,
    lineHeight: 17,
    textAlign: 'center',
    color: COLORS.textMuted,
    paddingHorizontal: 12,
  },
}));
