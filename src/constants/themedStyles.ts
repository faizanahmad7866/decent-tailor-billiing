import { StyleSheet } from 'react-native';

// Every style sheet in the app, kept with how it was made, so that switching to
// dark mode can make them all again from the new colours.

type Sheet = { target: object; build: () => StyleSheet.NamedStyles<any> };

const sheets: Sheet[] = [];

/**
 * StyleSheet.create, from a function rather than an object, so the sheet can be
 * rebuilt when the colours change. The object it returns stays the same one, and
 * only its values change: read as `styles.page` during render, as always.
 */
export function themedStyles<T extends StyleSheet.NamedStyles<T>>(
  build: () => T & StyleSheet.NamedStyles<any>
): T {
  const target = StyleSheet.create(build());
  sheets.push({ target, build });
  return target;
}

/** Makes every sheet again from the colours of the moment. */
export function rebuildStyles(): void {
  sheets.forEach(({ target, build }) => {
    Object.assign(target, StyleSheet.create(build()));
  });
}
