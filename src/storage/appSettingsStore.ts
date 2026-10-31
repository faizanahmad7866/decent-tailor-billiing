import { File, Paths } from 'expo-file-system';
import type { Language } from '../i18n/t';

// The tailor's language and light or dark, remembered so the app opens as it was
// left. A small JSON file, as for the voice: it belongs to this phone, so it is
// not part of a backup.

export interface AppSettings {
  language: Language;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  darkMode: false,
};

function file(): File {
  return new File(Paths.document, 'app-settings.json');
}

export function parseAppSettings(text: string): AppSettings {
  const saved: unknown = JSON.parse(text);
  if (typeof saved !== 'object' || saved === null) return DEFAULT_SETTINGS;
  const { language, darkMode } = saved as Partial<AppSettings>;
  return {
    language: language === 'hi' ? 'hi' : 'en',
    darkMode: darkMode === true,
  };
}

/** The remembered choice: English and light until the tailor changes them. */
export function loadAppSettings(): AppSettings {
  try {
    const saved = file();
    return saved.exists ? parseAppSettings(saved.textSync()) : DEFAULT_SETTINGS;
  } catch {
    // An unreadable file leaves the app as at the start.
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  file().write(JSON.stringify(settings));
}
