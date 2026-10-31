import { File, Paths } from 'expo-file-system';

// Whether the app speaks the meters and the discount aloud, remembered so it
// is still as the tailor left it the next time the app opens. A small JSON
// file, as for the printer: it belongs to this phone, so it is not part of a
// backup.

function file(): File {
  return new File(Paths.document, 'voice.json');
}

/** The remembered choice. On until the tailor turns it off. */
export function loadVoiceEnabled(): boolean {
  try {
    const saved = file();
    if (!saved.exists) return true;
    return JSON.parse(saved.textSync()).enabled !== false;
  } catch {
    // An unreadable file leaves the voice on, as at the start.
    return true;
  }
}

export function saveVoiceEnabled(enabled: boolean): void {
  file().write(JSON.stringify({ enabled }));
}
