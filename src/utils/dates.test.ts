import { dayLabel, formatDate, formatDateTime, formatTime } from './dates';

// Built from local parts, so the expectations hold in any time zone.
const local = (h: number, m: number): string =>
  new Date(2026, 9, 28, h, m).toISOString();

describe('formatDate', () => {
  it('writes day, short month and year', () => {
    expect(formatDate(local(10, 0))).toBe('28 Oct 2026');
  });
});

describe('formatDateTime', () => {
  it.each([
    [0, 5, '28 Oct 2026, 12:05 am'],
    [12, 0, '28 Oct 2026, 12:00 pm'],
    [16, 30, '28 Oct 2026, 4:30 pm'],
  ])('writes %i:%i on a 12-hour clock', (h, m, text) => {
    expect(formatDateTime(local(h, m))).toBe(text);
  });
});

describe('formatTime', () => {
  it('writes a 12-hour clock', () => {
    expect(formatTime(local(16, 5))).toBe('4:05 pm');
    expect(formatTime(local(0, 0))).toBe('12:00 am');
  });
});

describe('dayLabel', () => {
  const now = new Date(2026, 9, 28, 15, 0);

  it('calls the same day Today, whatever the hour', () => {
    expect(dayLabel(local(0, 1), now)).toBe('Today');
    expect(dayLabel(local(23, 59), now)).toBe('Today');
  });

  it('calls the day before Yesterday', () => {
    expect(dayLabel(new Date(2026, 9, 27, 23, 0).toISOString(), now)).toBe(
      'Yesterday'
    );
  });

  it('writes the date for anything older', () => {
    expect(dayLabel(new Date(2026, 9, 20, 9, 0).toISOString(), now)).toBe(
      '20 Oct 2026'
    );
  });
});
