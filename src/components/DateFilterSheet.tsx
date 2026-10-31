import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { shownRange } from '../i18n/dates';
import { t } from '../i18n/t';
import {
  pickDay,
  PRESETS,
  presetRange,
  sameDay,
  selectionRange,
  startOfDay,
  type DateRange,
  type Selection,
} from '../utils/dateRange';
import { Button } from './Button';
import { RangeCalendar } from './RangeCalendar';
import { Tap } from './Tap';

interface DateFilterSheetProps {
  visible: boolean;
  /** The days now shown, or null for every date. */
  value: DateRange | null;
  /** The chosen days; null shows every date. */
  onApply: (range: DateRange | null) => void;
  onClose: () => void;
  title?: string;
  /** The button under the calendar. */
  applyLabel?: string;
  /** Offers "Show all dates" while a range is applied. */
  allowAll?: boolean;
}

const isSameRange = (a: DateRange | null, b: DateRange): boolean =>
  !!a && sameDay(a.from, b.from) && sameDay(a.to, b.to);

/**
 * Which days of bills to show: a quick option (today, this month, last 60
 * days…) applies at once; or days are picked on the calendar — one day, or
 * a first and last — and applied with the button.
 */
export const DateFilterSheet: React.FC<DateFilterSheetProps> = ({
  visible,
  value,
  onApply,
  onClose,
  title = t('Filter by date'),
  applyLabel = t('Show these bills'),
  allowAll = true,
}) => {
  const insets = useSafeAreaInsets();
  const [selection, setSelection] = useState<Selection>({
    start: null,
    end: null,
  });
  // Today, as of the moment the sheet opens: a sheet left open past midnight
  // would otherwise still offer yesterday as "today".
  const [today, setToday] = useState(() => startOfDay(new Date()));

  // Opens showing what is applied now, ready to be changed.
  useEffect(() => {
    if (!visible) return;
    setToday(startOfDay(new Date()));
    setSelection({ start: value?.from ?? null, end: value?.to ?? null });
  }, [visible, value]);

  const picked = selectionRange(selection);

  return (
    <Modal
      visible={visible}
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
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>

            <View style={styles.presets}>
              {PRESETS.map(({ value: preset, label }) => {
                const range = presetRange(preset, today);
                const selected = isSameRange(value, range);
                return (
                  <Tap
                    key={preset}
                    onPress={() => onApply(range)}
                    haptic="select"
                    throttle={false}
                    accessibilityLabel={t(label)}
                    accessibilityState={{ selected }}
                    style={[styles.preset, selected && styles.presetSelected]}
                  >
                    <Text
                      style={[
                        styles.presetLabel,
                        selected && styles.presetLabelSelected,
                      ]}
                    >
                      {t(label)}
                    </Text>
                  </Tap>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{t('Or pick dates')}</Text>
            <RangeCalendar
              selection={selection}
              onPick={(day) => setSelection((now) => pickDay(now, day))}
              today={today}
            />
            <Text style={styles.hint}>
              {!picked
                ? t('Tap a day, or a first and a last day.')
                : selection.end
                  ? shownRange(picked, today)
                  : t(
                      '{0} — tap another day for a range, or show just this day.',
                      shownRange(picked, today)
                    )}
            </Text>

            <Button
              label={applyLabel}
              icon="checkmark"
              onPress={() => picked && onApply(picked)}
              disabled={!picked}
            />
            {value && allowAll ? (
              <Button
                label={t('Show all dates')}
                variant="secondary"
                onPress={() => onApply(null)}
              />
            ) : null}
          </ScrollView>
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
    maxHeight: '92%',
    alignSelf: 'center',
    paddingTop: 10,
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
    marginBottom: 6,
  },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  title: {
    ...TYPE.title,
    fontSize: 21,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryTint,
  },
  presetSelected: { backgroundColor: COLORS.primary },
  presetLabel: { ...TYPE.label, fontSize: 14, color: COLORS.accent },
  presetLabelSelected: { color: COLORS.onPrimary },
  sectionLabel: {
    ...TYPE.overline,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  hint: {
    ...TYPE.label,
    minHeight: 36,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
}));
