import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { later, t } from '../i18n/t';
import {
  describeProblem,
  turnOnBluetooth,
  type PrintProblem,
} from '../print/bluetoothPrint';
import { Button } from './Button';

interface PrintProblemNoticeProps {
  problem: PrintProblem;
  printerName: string;
  /** Tries the same thing again: print, or list the printers. */
  onRetry: () => void;
}

// The one step that fixes each problem. None for the two a tap can't fix.
const ACTIONS: Partial<
  Record<PrintProblem, { label: string; run: (retry: () => void) => void }>
> = {
  'bluetooth-off': {
    label: later('Turn on Bluetooth'),
    run: () => void turnOnBluetooth(),
  },
  permission: { label: later('Allow'), run: (retry) => retry() },
  'permission-blocked': {
    label: later('Open app settings'),
    run: () => void Linking.openSettings(),
  },
  connect: { label: later('Try again'), run: (retry) => retry() },
  lost: { label: later('Try again'), run: (retry) => retry() },
  failed: { label: later('Try again'), run: (retry) => retry() },
};

/** What stopped the printer, and the button that sorts it out. */
export const PrintProblemNotice: React.FC<PrintProblemNoticeProps> = ({
  problem,
  printerName,
  onRetry,
}) => {
  const { title, message } = describeProblem(problem, printerName);
  const action = ACTIONS[problem];
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={22} color={COLORS.danger} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      {action ? (
        <Button
          label={t(action.label)}
          variant="danger"
          onPress={() => action.run(onRetry)}
        />
      ) : null}
    </View>
  );
};

const styles = themedStyles(() => ({
  notice: {
    gap: 8,
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.dangerTint,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...TYPE.bodyStrong, flex: 1, color: COLORS.textPrimary },
  message: { ...TYPE.body, lineHeight: 21, color: COLORS.textSecondary },
}));
