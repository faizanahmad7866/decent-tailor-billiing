import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';
import { rebuildStyles } from '../constants/themedStyles';
import { applyLook } from '../constants/theme';
import { setLanguage as setWordsLanguage, type Language } from '../i18n/t';
import {
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
} from '../storage/appSettingsStore';

// The language and dark mode switches. Changing one sets the words and colours
// for the whole app; App then draws every screen again, on the page it was on.

let settings = loadAppSettings();
const listeners = new Set<() => void>();

function apply(): void {
  setWordsLanguage(settings.language);
  applyLook(settings.darkMode, settings.language === 'hi');
  rebuildStyles();
  // The phone's own dialogs, keyboard and pickers follow along.
  Appearance.setColorScheme(settings.darkMode ? 'dark' : 'light');
}

// At load, so the first screen is already in the tailor's choice.
apply();

function change(next: AppSettings): void {
  settings = next;
  try {
    saveAppSettings(settings);
  } catch {
    // Not remembered: it still holds until the app is closed.
  }
  apply();
  listeners.forEach((listener) => listener());
}

export function setLanguage(language: Language): void {
  if (language !== settings.language) change({ ...settings, language });
}

export function setDarkMode(darkMode: boolean): void {
  if (darkMode !== settings.darkMode) change({ ...settings, darkMode });
}

export function useAppSettings(): AppSettings {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => settings
  );
}
