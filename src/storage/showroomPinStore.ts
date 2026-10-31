import { File, Paths } from 'expo-file-system';
import { isFullPin } from '../utils/showroom';

// The PIN that leaves showroom mode, remembered so it is asked for once. It only
// keeps a customer out of the bills while holding the phone, it guards nothing
// else, so a small JSON file is enough. It belongs to this phone, so it is not part
// of a backup.

function file(): File {
  return new File(Paths.document, 'showroom-pin.json');
}

export function parseShowroomPin(text: string): string {
  const pin: unknown = JSON.parse(text)?.pin;
  return typeof pin === 'string' && isFullPin(pin) ? pin : '';
}

/** The remembered PIN, or empty until one is set. */
export function loadShowroomPin(): string {
  try {
    const saved = file();
    return saved.exists ? parseShowroomPin(saved.textSync()) : '';
  } catch {
    // An unreadable file only means the PIN is asked for again.
    return '';
  }
}

export function saveShowroomPin(pin: string): void {
  file().write(JSON.stringify({ pin }));
}
