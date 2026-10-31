import { later } from '../i18n/t';
import { dayLabel, formatDate } from './dates';

// The date filter on the Bills page: which days to show, picked from quick
// options or from a calendar. Days are whole local days, so "28 Oct" means
// midnight to midnight on the phone's own clock.

/** Whole days, both ends included. Both are the start of their day. */
export interface DateRange {
  from: Date;
  to: Date;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export type RangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'thisMonth'
  | 'lastMonth'
  | 'last30'
  | 'last60';

export const PRESETS: readonly { value: RangePreset; label: string }[] = [
  { value: 'today', label: later('Today') },
  { value: 'yesterday', label: later('Yesterday') },
  { value: 'last7', label: later('Last 7 days') },
  { value: 'thisMonth', label: later('This month') },
  { value: 'lastMonth', label: later('Last month') },
  { value: 'last30', label: later('Last 30 days') },
  { value: 'last60', label: later('Last 60 days') },
];

/** The days a quick option stands for, counted from `now`. */
export function presetRange(
  preset: RangePreset,
  now: Date = new Date()
): DateRange {
  const today = startOfDay(now);
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday':
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case 'last7':
      return { from: addDays(today, -6), to: today };
    case 'last30':
      return { from: addDays(today, -29), to: today };
    case 'last60':
      return { from: addDays(today, -59), to: today };
    case 'thisMonth':
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month + 1, 0),
      };
    case 'lastMonth':
      return {
        from: new Date(year, month - 1, 1),
        to: new Date(year, month, 0),
      };
  }
}

/** Whether a bill made at `iso` falls on one of the range's days. */
export function isInRange(iso: string, range: DateRange): boolean {
  const time = new Date(iso).getTime();
  return time >= range.from.getTime() && time < addDays(range.to, 1).getTime();
}

export const monthTitle = (year: number, month: number): string =>
  `${MONTH_NAMES[month]} ${year}`;

/**
 * What a range is called on screen: "Today", "October 2026" for a whole
 * month, a date for one day, or "1 Oct – 28 Oct 2026".
 */
export function rangeLabel(range: DateRange, now: Date = new Date()): string {
  const { from, to } = range;
  if (sameDay(from, to)) return dayLabel(from.toISOString(), now);

  const wholeMonth =
    from.getDate() === 1 &&
    from.getMonth() === to.getMonth() &&
    from.getFullYear() === to.getFullYear() &&
    sameDay(to, new Date(to.getFullYear(), to.getMonth() + 1, 0));
  if (wholeMonth) return monthTitle(from.getFullYear(), from.getMonth());

  const start = formatDate(from.toISOString());
  const end = formatDate(to.toISOString());
  // "1 Oct – 28 Oct 2026": the year is said once when both days share it.
  const short =
    from.getFullYear() === to.getFullYear()
      ? start.replace(` ${from.getFullYear()}`, '')
      : start;
  return `${short} – ${end}`;
}

/** The weeks of a month, Sunday first, with null where the week has no day. */
export function monthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7)
  );
}

/** Days tapped on the calendar so far: nothing, a start, or a start and end. */
export interface Selection {
  start: Date | null;
  end: Date | null;
}

/**
 * What tapping `day` does: the first tap picks the start, the second the end
 * (a day before the start moves the start instead), and a tap after that
 * begins again.
 */
export function pickDay(selection: Selection, day: Date): Selection {
  if (!selection.start || selection.end || day < selection.start) {
    return { start: day, end: null };
  }
  return { start: selection.start, end: day };
}

/** The range a selection stands for; a lone start is that one day. */
export function selectionRange(selection: Selection): DateRange | null {
  if (!selection.start) return null;
  return { from: selection.start, to: selection.end ?? selection.start };
}

/**
 * `date` moved back by whole months, the day kept — or the month's last day
 * where it has no such day (31 Aug less 6 months is 28 Feb, not 3 Mar).
 */
export function monthsAgo(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() - months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay)
  );
}

/** How far back the To collect total looks, in months; null is all bills. */
export type CollectMonths = 2 | 4 | 6 | null;

export const COLLECT_MONTHS: readonly (2 | 4 | 6)[] = [2, 4, 6];

/** The days the To collect total covers: back `months` from today, or all. */
export function collectRange(
  months: CollectMonths,
  now: Date = new Date()
): DateRange | null {
  if (months === null) return null;
  const today = startOfDay(now);
  return { from: monthsAgo(today, months), to: today };
}
