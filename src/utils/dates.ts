// Spelled out by hand rather than through toLocaleString: Intl on Android's
// JS engine varies by phone, and a bill must read the same on all of them.

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** "28 Oct 2026", in the phone's own time zone. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "28 Oct 2026, 4:05 pm" */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * "Today", "Yesterday", or the date — how a list of things made over many
 * days is headed. `now` can be given so the answer can be tested.
 */
export function dayLabel(iso: string, now: Date = new Date()): string {
  // Whole days apart, rounded so a clock change can't make it 0.96 or 1.04.
  const days = Math.round(
    (startOfDay(now) - startOfDay(new Date(iso))) / MS_PER_DAY
  );
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return formatDate(iso);
}

/** "4:05 pm" */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'am' : 'pm'}`;
}
