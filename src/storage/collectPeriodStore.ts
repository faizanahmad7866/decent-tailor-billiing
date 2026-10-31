import { File, Paths } from 'expo-file-system';
import { COLLECT_MONTHS, type CollectMonths } from '../utils/dateRange';

// How far back the Bills page's To collect total looks (2, 4 or 6 months, or
// every bill), remembered so it is still what the tailor chose the next time
// the app opens. A small JSON file, as for the printer: it belongs to this
// phone, so it is not part of a backup.

function file(): File {
  return new File(Paths.document, 'collect-period.json');
}

/** The remembered period, or null (every bill) if none was chosen. */
export function loadCollectMonths(): CollectMonths {
  try {
    const saved = file();
    if (!saved.exists) return null;
    const { months } = JSON.parse(saved.textSync());
    return COLLECT_MONTHS.find((allowed) => allowed === months) ?? null;
  } catch {
    // An unreadable file only means every bill is counted, as at the start.
    return null;
  }
}

export function saveCollectMonths(months: CollectMonths): void {
  file().write(JSON.stringify({ months }));
}
