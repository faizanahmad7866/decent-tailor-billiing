import { File, Paths } from 'expo-file-system';

// Whether the Bills page's money totals are hidden, remembered so a tailor who
// keeps them private does not have to hide them again each time the app opens. A
// small JSON file, as for the printer: it belongs to this phone, so it is not part
// of a backup.

function file(): File {
  return new File(Paths.document, 'amounts-hidden.json');
}

export function parseAmountsHidden(text: string): boolean {
  return JSON.parse(text)?.hidden === true;
}

/** The remembered choice. Shown until the tailor hides them. */
export function loadAmountsHidden(): boolean {
  try {
    const saved = file();
    return saved.exists ? parseAmountsHidden(saved.textSync()) : false;
  } catch {
    // An unreadable file only means the totals show, as at the start.
    return false;
  }
}

export function saveAmountsHidden(hidden: boolean): void {
  file().write(JSON.stringify({ hidden }));
}
