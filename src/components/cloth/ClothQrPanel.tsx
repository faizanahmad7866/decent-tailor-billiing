import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { usePrinter } from '../../hooks/usePrinter';
import { t } from '../../i18n/t';
import {
  toPrinterError,
  type PrintProblem,
  type PrintStage,
} from '../../print/bluetoothPrint';
import { printClothLabel } from '../../print/printBill';
import type { Cloth } from '../../repositories/clothRepo';
import type { ClothType } from '../../repositories/clothTypeRepo';
import { clothQrPayload } from '../../utils/clothQr';
import { haptics } from '../../utils/haptics';
import { Button } from '../Button';
import { PrintProblemNotice } from '../PrintProblemNotice';
import { QrCode } from '../QrCode';

const QR_SIZE = 200;

type Phase =
  | { kind: 'idle' }
  | { kind: 'working'; stage: PrintStage }
  | { kind: 'done' }
  | { kind: 'problem'; problem: PrintProblem };

interface ClothQrPanelProps {
  cloth: Cloth;
  /** The type the label is for; null is the whole cloth. */
  type: ClothType | null;
  /** No printer chosen yet: that is set up once, in Settings. */
  onChoosePrinter: () => void;
}

/** A QR code for a cloth or one of its types, and printing its label. */
export const ClothQrPanel: React.FC<ClothQrPanelProps> = ({
  cloth,
  type,
  onChoosePrinter,
}) => {
  const { printer, printerName, setLink } = usePrinter();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const working = phase.kind === 'working';

  const print = async (): Promise<void> => {
    if (!printer) {
      onChoosePrinter();
      return;
    }
    if (working) return;
    setPhase({ kind: 'working', stage: 'connecting' });
    try {
      await printClothLabel(cloth, type, printer, (stage) =>
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

  const status = (): React.ReactNode => {
    if (phase.kind === 'problem') {
      return (
        <PrintProblemNotice
          problem={phase.problem}
          printerName={printerName}
          onRetry={() => void print()}
        />
      );
    }
    if (phase.kind === 'working') {
      return (
        <View style={styles.status} accessibilityLiveRegion="polite">
          <ActivityIndicator color={COLORS.accent} />
          <Text style={styles.statusText}>
            {phase.stage === 'connecting'
              ? t('Connecting to {0}…', printerName)
              : t('Printing the label…')}
          </Text>
        </View>
      );
    }
    if (phase.kind === 'done') {
      return (
        <View style={styles.status} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
          <Text style={[styles.statusText, styles.statusDone]}>
            {t('Label printed on {0}', printerName)}
          </Text>
        </View>
      );
    }
    return (
      <Text style={styles.note}>
        {printer
          ? t('Printer: {0}', printerName)
          : t('No printer chosen yet — pick one once, in Settings')}
      </Text>
    );
  };

  return (
    <View style={styles.panel}>
      <View style={styles.frame}>
        <QrCode
          text={clothQrPayload(cloth.id, type?.id ?? null)}
          size={QR_SIZE}
        />
      </View>
      <Text style={styles.note}>
        {type
          ? t(
              '{0} — {1} · scan it on a new bill to add this type at its rate',
              cloth.name,
              type.name
            )
          : t(
              'Cloth No. {0} · scan it on a new bill to add this cloth',
              cloth.id
            )}
      </Text>
      {status()}
      <Button
        label={printer ? t('Print QR label') : t('Choose printer to print')}
        icon="print-outline"
        variant="secondary"
        onPress={() => void print()}
        loading={working}
      />
    </View>
  );
};

const styles = themedStyles(() => ({
  panel: { gap: 12 },
  // True black on white with its own margin, as every camera needs.
  frame: {
    alignSelf: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.qrLight,
  },
  note: { ...TYPE.caption, textAlign: 'center', color: COLORS.textSecondary },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  statusText: { ...TYPE.bodyStrong, color: COLORS.textSecondary },
  statusDone: { color: COLORS.success },
}));
