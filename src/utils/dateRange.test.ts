import {
  collectRange,
  isInRange,
  monthsAgo,
  monthGrid,
  pickDay,
  presetRange,
  rangeLabel,
  selectionRange,
  type DateRange,
} from './dateRange';

// Wednesday 28 Oct 2026, mid-afternoon. Built from local parts so the
// expectations hold in any time zone.
const NOW = new Date(2026, 9, 28, 15, 30);
const day = (y: number, m: number, d: number): Date => new Date(y, m - 1, d);

describe('presetRange', () => {
  it.each([
    ['today', day(2026, 10, 28), day(2026, 10, 28)],
    ['yesterday', day(2026, 10, 27), day(2026, 10, 27)],
    ['last7', day(2026, 10, 22), day(2026, 10, 28)],
    ['last30', day(2026, 9, 29), day(2026, 10, 28)],
    ['last60', day(2026, 8, 30), day(2026, 10, 28)],
    ['thisMonth', day(2026, 10, 1), day(2026, 10, 31)],
    ['lastMonth', day(2026, 9, 1), day(2026, 9, 30)],
  ] as const)('%s', (preset, from, to) => {
    expect(presetRange(preset, NOW)).toEqual({ from, to });
  });

  it('reaches back across a year end, and over a short February', () => {
    const january = new Date(2026, 0, 10);
    expect(presetRange('lastMonth', january)).toEqual({
      from: day(2025, 12, 1),
      to: day(2025, 12, 31),
    });
    expect(presetRange('lastMonth', new Date(2026, 2, 5)).to).toEqual(
      day(2026, 2, 28)
    );
  });
});

describe('isInRange', () => {
  const range: DateRange = { from: day(2026, 10, 1), to: day(2026, 10, 31) };

  it('counts every moment of the first and last day', () => {
    expect(isInRange(new Date(2026, 9, 1, 0, 0).toISOString(), range)).toBe(
      true
    );
    expect(isInRange(new Date(2026, 9, 31, 23, 59).toISOString(), range)).toBe(
      true
    );
  });

  it('leaves out the moments either side', () => {
    expect(isInRange(new Date(2026, 8, 30, 23, 59).toISOString(), range)).toBe(
      false
    );
    expect(isInRange(new Date(2026, 10, 1, 0, 0).toISOString(), range)).toBe(
      false
    );
  });
});

describe('rangeLabel', () => {
  it('names one day the way the list does', () => {
    expect(rangeLabel(presetRange('today', NOW), NOW)).toBe('Today');
    expect(rangeLabel(presetRange('yesterday', NOW), NOW)).toBe('Yesterday');
    const older = { from: day(2026, 10, 3), to: day(2026, 10, 3) };
    expect(rangeLabel(older, NOW)).toBe('3 Oct 2026');
  });

  it('names a whole month by its month', () => {
    expect(rangeLabel(presetRange('thisMonth', NOW), NOW)).toBe('October 2026');
    expect(rangeLabel(presetRange('lastMonth', NOW), NOW)).toBe(
      'September 2026'
    );
  });

  it('writes any other stretch as from – to, the year said once', () => {
    expect(rangeLabel(presetRange('last7', NOW), NOW)).toBe(
      '22 Oct – 28 Oct 2026'
    );
    expect(
      rangeLabel({ from: day(2025, 12, 20), to: day(2026, 1, 5) }, NOW)
    ).toBe('20 Dec 2025 – 5 Jan 2026');
  });
});

describe('monthGrid', () => {
  it('lays a month out in Sunday-first weeks, padded with nulls', () => {
    const weeks = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(weeks[0][4]).toEqual(day(2026, 10, 1));
    expect(weeks[4][6]).toEqual(day(2026, 10, 31));
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
  });

  it('needs six weeks when a long month starts late in the week', () => {
    expect(monthGrid(2026, 7)).toHaveLength(6); // Aug 2026: Saturday start
  });
});

describe('pickDay', () => {
  const empty = { start: null, end: null };

  it('takes the first tap as the start, the second as the end', () => {
    const one = pickDay(empty, day(2026, 10, 10));
    expect(one).toEqual({ start: day(2026, 10, 10), end: null });
    expect(pickDay(one, day(2026, 10, 20))).toEqual({
      start: day(2026, 10, 10),
      end: day(2026, 10, 20),
    });
  });

  it('moves the start when the second tap is on an earlier day', () => {
    const one = pickDay(empty, day(2026, 10, 10));
    expect(pickDay(one, day(2026, 10, 5))).toEqual({
      start: day(2026, 10, 5),
      end: null,
    });
  });

  it('starts again after a full range', () => {
    const full = { start: day(2026, 10, 10), end: day(2026, 10, 20) };
    expect(pickDay(full, day(2026, 10, 25))).toEqual({
      start: day(2026, 10, 25),
      end: null,
    });
  });
});

describe('selectionRange', () => {
  it('is nothing until a day is picked, then one day or the stretch', () => {
    expect(selectionRange({ start: null, end: null })).toBeNull();
    const d = day(2026, 10, 10);
    expect(selectionRange({ start: d, end: null })).toEqual({ from: d, to: d });
    expect(selectionRange({ start: d, end: day(2026, 10, 12) })).toEqual({
      from: d,
      to: day(2026, 10, 12),
    });
  });
});

describe('monthsAgo', () => {
  it('keeps the day of the month', () => {
    expect(monthsAgo(day(2026, 10, 28), 2)).toEqual(day(2026, 8, 28));
    expect(monthsAgo(day(2026, 3, 15), 4)).toEqual(day(2025, 11, 15));
  });

  it('falls back to the last day of a shorter month', () => {
    expect(monthsAgo(day(2026, 8, 31), 6)).toEqual(day(2026, 2, 28));
    expect(monthsAgo(day(2028, 8, 31), 6)).toEqual(day(2028, 2, 29));
    expect(monthsAgo(day(2026, 10, 31), 4)).toEqual(day(2026, 6, 30));
  });
});

describe('collectRange', () => {
  it('runs from the same day N months ago to today', () => {
    expect(collectRange(4, NOW)).toEqual({
      from: day(2026, 6, 28),
      to: day(2026, 10, 28),
    });
  });

  it('includes the first day back, and nothing earlier', () => {
    const range = collectRange(2, NOW)!;
    expect(isInRange(new Date(2026, 7, 28, 0, 0).toISOString(), range)).toBe(
      true
    );
    expect(isInRange(new Date(2026, 7, 27, 23, 59).toISOString(), range)).toBe(
      false
    );
  });

  it('is no range at all for every bill', () => {
    expect(collectRange(null, NOW)).toBeNull();
  });
});
