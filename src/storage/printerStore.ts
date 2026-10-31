import { File, Paths } from 'expo-file-system';

// The shop's printer, remembered so Print goes straight to it. A small JSON
// file rather than a database row: it belongs to this phone, so it is neither
// part of a backup nor carried to another phone by a restore.

export interface SavedPrinter {
  name: string;
  address: string;
}

function file(): File {
  return new File(Paths.document, 'printer.json');
}

/** The remembered printer, or null if none was chosen yet. */
export function loadPrinter(): SavedPrinter | null {
  try {
    const saved = file();
    if (!saved.exists) return null;
    const { name, address } = JSON.parse(saved.textSync());
    if (typeof address !== 'string' || !address) return null;
    return { name: typeof name === 'string' ? name : '', address };
  } catch {
    // An unreadable file only means choosing the printer once more.
    return null;
  }
}

export function savePrinter(printer: SavedPrinter): void {
  file().write(JSON.stringify(printer));
}

export function forgetPrinter(): void {
  const saved = file();
  if (saved.exists) saved.delete();
}
