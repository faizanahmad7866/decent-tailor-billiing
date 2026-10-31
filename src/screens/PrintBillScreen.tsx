import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Footer } from '../components/Footer';
import { PrintProblemNotice } from '../components/PrintProblemNotice';
import { PrinterList } from '../components/PrinterList';
import { ReceiptPreview } from '../components/ReceiptPreview';
import { COLORS, GUTTER, SHADOW, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { PageColumn, PageColumns, usePagePadding } from '../layout/Page';
import { FORM_MAX_WIDTH, useLayout } from '../layout/useLayout';
import { usePrinter } from '../hooks/usePrinter';
import type { RootScreenProps } from '../navigation/types';
import {
  toPrinterError,
  type BluetoothDevice,
  type PrintProblem,
  type PrintStage,
} from '../print/bluetoothPrint';
import { printReceipt } from '../print/printBill';
import { receiptParts } from '../print/receiptText';
import { billRepo, type Bill } from '../repositories/billRepo';
import { haptics } from '../utils/haptics';

const PREVIEW_MAX_WIDTH = 320;

type Phase =
  | { kind: 'idle' }
  | { kind: 'working'; stage: PrintStage }
  | { kind: 'done' }
  | { kind: 'problem'; problem: PrintProblem };

// Problems the tailor fixes outside the app (Bluetooth switched on, the
// permission given in settings): coming back clears them, ready to print.
const FIXED_ELSEWHERE: PrintProblem[] = ['bluetooth-off', 'permission-blocked'];

/**
 * Print, Bluetooth only: the printers to pick from (paired, or found by a
 * search), the receipt exactly as it will come out, and one button. The
 * printer picked is remembered and connected to as the page opens, so after
 * the first time printing is a single tap that starts at once.
 */
export const PrintBillScreen: React.FC<RootScreenProps<'PrintBill'>> = ({
  navigation,
  route,
}) => {
  const pagePadding = usePagePadding({ footer: true });
  const { billId, autoPrint = false } = route.params;
  const { pageMaxWidth } = useLayout();
  const { width: windowWidth } = useWindowDimensions();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const {
    printer,
    printerName,
    link,
    setLink,
    problem: linkProblem,
    setProblem: setLinkProblem,
    connect,
    choose,
  } = usePrinter();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const parts = useMemo(() => (bill ? receiptParts(bill) : []), [bill]);

  useEffect(() => {
    billRepo.get(billId).then(
      (loaded) => {
        setBill(loaded);
        setLoadFailed(!loaded);
      },
      () => setLoadFailed(true)
    );
  }, [billId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setPhase((current) =>
        current.kind === 'problem' && FIXED_ELSEWHERE.includes(current.problem)
          ? { kind: 'idle' }
          : current
      );
      setLinkProblem((current) =>
        current && FIXED_ELSEWHERE.includes(current) ? null : current
      );
    });
    return () => subscription.remove();
  }, [setLinkProblem]);

  const working = phase.kind === 'working';

  const print = async (): Promise<void> => {
    if (!bill || !printer || working) return;
    setLinkProblem(null);
    setPhase({ kind: 'working', stage: 'connecting' });
    try {
      await printReceipt(bill, printer, (stage) =>
        setPhase({ kind: 'working', stage })
      );
      setLink('connected');
      haptics.success();
      setPhase({ kind: 'done' });
    } catch (error) {
      const { problem } = toPrinterError(error);
      if (problem === 'connect' || problem === 'lost') setLink('failed');
      haptics.error();
      setPhase({ kind: 'problem', problem });
    }
  };
  // A bill just made from a design is printed as soon as the printer is
  // ready, once — whether it was remembered or only just chosen. It waits for
  // the connection the page opens with to settle, so two attempts do not meet,
  // and for a problem with a printer just chosen to be seen first. A failure
  // shows its notice with Retry, as any print does.
  const autoPrinted = useRef(false);
  useEffect(() => {
    if (!autoPrint || autoPrinted.current || !bill || !printer) return;
    if (link === 'connecting' || linkProblem) return;
    autoPrinted.current = true;
    void print();
    // `print` only reads what these already name.
  }, [autoPrint, bill, printer, link, linkProblem]);

  if (!bill) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t("Couldn't open this bill")}
            message={t(
              'Something went wrong while reading it. Your data is safe — go back and try again.'
            )}
          />
        ) : (
          <ActivityIndicator color={COLORS.accent} style={styles.loading} />
        )}
      </View>
    );
  }

  const select = (device: BluetoothDevice): void => {
    setPhase({ kind: 'idle' });
    choose(device);
  };

  // With no printer chosen yet and exactly one paired printer, there is
  // nothing to ask: it is taken.
  const adopt = (devices: BluetoothDevice[]): void => {
    if (printer) return;
    const printers = devices.filter((d) => d.isPrinter);
    if (printers.length === 1) select(printers[0]);
  };

  // 58 mm paper, printed across its middle 48 mm.
  const paperWidth = Math.min(
    PREVIEW_MAX_WIDTH,
    Math.min(windowWidth, FORM_MAX_WIDTH) - GUTTER * 2
  );
  const printWidth = (paperWidth * 48) / 58;

  const renderFooter = (): React.ReactNode => {
    const shown =
      phase.kind === 'problem'
        ? { problem: phase.problem, retry: () => void print() }
        : linkProblem && printer
          ? { problem: linkProblem, retry: () => void connect(printer) }
          : null;
    if (shown) {
      return (
        <PrintProblemNotice
          problem={shown.problem}
          printerName={printerName}
          onRetry={shown.retry}
        />
      );
    }
    switch (phase.kind) {
      case 'done':
        return (
          <>
            <View style={styles.status} accessibilityLiveRegion="polite">
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={COLORS.success}
              />
              <Text style={[styles.statusText, styles.statusDone]}>
                {t('Printed on {0}', printerName)}
              </Text>
            </View>
            <View style={styles.actions}>
              <Button
                label={t('Print again')}
                icon="print-outline"
                variant="secondary"
                onPress={() => void print()}
                style={styles.action}
              />
              <Button
                label={t('Done')}
                onPress={() => navigation.goBack()}
                style={styles.action}
              />
            </View>
          </>
        );
      default:
        return (
          <>
            {working ? (
              <View style={styles.status} accessibilityLiveRegion="polite">
                <ActivityIndicator color={COLORS.accent} />
                <Text style={styles.statusText}>
                  {phase.stage === 'connecting'
                    ? t('Connecting to {0}…', printerName)
                    : t('Printing… keep the phone near the printer')}
                </Text>
              </View>
            ) : null}
            <Button
              label={
                printer
                  ? t('Print on {0}', printerName)
                  : t('Choose a printer above')
              }
              icon="print"
              onPress={() => void print()}
              loading={working}
              disabled={!printer}
            />
          </>
        );
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={pagePadding}>
        <PageColumn wide>
          <PageColumns
            first={
              <PrinterList
                selected={printer}
                link={link}
                onSelect={select}
                disabled={working}
                autoSearch={!printer}
                onPairedLoaded={adopt}
              />
            }
            second={
              <>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>
                    {t('Receipt preview')}
                  </Text>
                  <Text style={styles.previewNote}>
                    {t('58 mm · prints exactly as shown')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.paper,
                    {
                      width: paperWidth,
                      paddingHorizontal: (paperWidth - printWidth) / 2,
                    },
                  ]}
                >
                  <ReceiptPreview parts={parts} width={printWidth} />
                </View>
              </>
            }
          />
        </PageColumn>
      </ScrollView>

      <Footer maxWidth={pageMaxWidth}>{renderFooter()}</Footer>
    </View>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  previewHeader: { alignItems: 'center', gap: 2, marginTop: 4 },
  previewTitle: { ...TYPE.overline, color: COLORS.textSecondary },
  previewNote: { ...TYPE.caption, color: COLORS.textMuted },
  paper: {
    alignSelf: 'center',
    paddingVertical: 16,
    borderRadius: 4,
    backgroundColor: COLORS.qrLight,
    ...SHADOW.raised,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  statusText: { ...TYPE.bodyStrong, color: COLORS.textSecondary },
  statusDone: { color: COLORS.success },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
}));
