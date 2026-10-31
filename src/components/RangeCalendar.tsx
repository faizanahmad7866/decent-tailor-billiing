import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { shownMonth } from '../i18n/dates';
import { getLanguage, t } from '../i18n/t';
import {
  monthGrid,
  sameDay,
  startOfDay,
  type Selection,
} from '../utils/dateRange';
import { IconButton } from './IconButton';
import { Tap } from './Tap';

const WEEKDAYS = () =>
  getLanguage() === 'hi'
    ? ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CELL_HEIGHT = 42;

interface RangeCalendarProps {
  selection: Selection;
  onPick: (day: Date) => void;
  /** Days after this one can't be picked: no bill is made in the future. */
  today: Date;
  /** The other way about: days ahead can be picked, and days already gone can't. */
  ahead?: boolean;
}

/**
 * A month calendar for picking a stretch of days: the first tap marks the
 * start, the second the end, and the days between are tinted. Opens on the
 * month of the start, or on this month.
 */
export const RangeCalendar: React.FC<RangeCalendarProps> = ({
  selection,
  onPick,
  today,
  ahead = false,
}) => {
  const [shown, setShown] = useState(() => {
    const anchor = selection.start ?? today;
    return { year: anchor.getFullYear(), month: anchor.getMonth() };
  });

  const isCurrentMonth =
    shown.year === today.getFullYear() && shown.month === today.getMonth();

  const step = (months: number): void => {
    const next = new Date(shown.year, shown.month + months, 1);
    setShown({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <IconButton
          icon="chevron-back"
          label={t('Previous month')}
          onPress={() => step(-1)}
          disabled={ahead && isCurrentMonth}
        />
        <Text accessibilityRole="header" style={styles.month}>
          {shownMonth(shown.year, shown.month)}
        </Text>
        <IconButton
          icon="chevron-forward"
          label={t('Next month')}
          onPress={() => step(1)}
          disabled={!ahead && isCurrentMonth}
        />
      </View>

      <View style={styles.week}>
        {WEEKDAYS().map((weekday, index) => (
          <Text key={index} style={[styles.cell, styles.weekday]}>
            {weekday}
          </Text>
        ))}
      </View>

      {monthGrid(shown.year, shown.month).map((week, row) => (
        <View key={row} style={styles.week}>
          {week.map((date, column) => {
            if (!date) return <View key={column} style={styles.cell} />;
            const future = ahead
              ? date < startOfDay(today)
              : date > startOfDay(today);
            const { start, end } = selection;
            const isStart = !!start && sameDay(date, start);
            const isEnd = !!end && sameDay(date, end);
            const between = !!start && !!end && date > start && date < end;
            const edge = isStart || isEnd;
            return (
              <Tap
                key={column}
                onPress={() => onPick(date)}
                disabled={future}
                haptic="select"
                throttle={false}
                accessibilityLabel={date.toDateString()}
                accessibilityState={{ selected: edge, disabled: future }}
                style={[styles.cell, between && styles.between]}
              >
                <View style={[styles.day, edge && styles.edge]}>
                  <Text
                    style={[
                      styles.dayText,
                      edge && styles.edgeText,
                      future && styles.futureText,
                      sameDay(date, today) && !edge && styles.todayText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </Tap>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = themedStyles(() => ({
  calendar: { gap: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  month: { ...TYPE.heading, color: COLORS.textPrimary },
  week: { flexDirection: 'row' },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekday: { ...TYPE.overline, textAlign: 'center', color: COLORS.textMuted },
  // The days between the two ends run together as one tinted band.
  between: { backgroundColor: COLORS.primaryTint },
  day: {
    width: CELL_HEIGHT - 4,
    height: CELL_HEIGHT - 4,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  edge: { backgroundColor: COLORS.primary },
  dayText: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  edgeText: { color: COLORS.onPrimary },
  futureText: { color: COLORS.borderStrong },
  todayText: { color: COLORS.accent },
}));
