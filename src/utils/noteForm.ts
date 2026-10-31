import { noteToHindi } from './noteHindi';

// A note as the form holds it: what was typed, its Hindi, and whether that
// Hindi is the tailor's own. The Hindi follows the English as it is typed —
// until the tailor writes their own, which then stays — the way a cloth's
// Hindi name does.

export const NOTE_MAX_LENGTH = 200;

export interface NoteValue {
  text: string;
  hindi: string;
  /** The tailor has typed their own Hindi, so typing the note no longer rewrites it. */
  hindiEdited: boolean;
}

export const EMPTY_NOTE: NoteValue = {
  text: '',
  hindi: '',
  hindiEdited: false,
};

/** "  Dry   clean\n only " → "Dry clean\nonly": stray spaces are never part of a note. */
export function normalizeNote(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1]))
    .join('\n')
    .trim();
}

/** The note as it is typed: its Hindi follows unless it was written by hand. */
export function typeNote(current: NoteValue, text: string): NoteValue {
  return {
    ...current,
    text,
    hindi: current.hindiEdited
      ? current.hindi
      : noteToHindi(normalizeNote(text)),
  };
}

/** The Hindi typed by hand. Clearing it hands it back to the automatic one. */
export function typeNoteHindi(current: NoteValue, hindi: string): NoteValue {
  return { ...current, hindi, hindiEdited: hindi.trim() !== '' };
}

/** A saved note for the form. A Hindi that differs from the automatic one was written by hand. */
export function loadNote(
  note: string | null,
  savedHindi: string | null
): NoteValue {
  const text = note ?? '';
  const auto = noteToHindi(normalizeNote(text));
  return {
    text,
    hindi: savedHindi ?? auto,
    hindiEdited: savedHindi !== null && savedHindi !== auto,
  };
}

/** What to save: nothing at all for a blank note, and its Hindi only with it. */
export function noteToSave(value: NoteValue): {
  note: string | null;
  noteHindi: string | null;
} {
  const note = normalizeNote(value.text);
  if (!note) return { note: null, noteHindi: null };
  return { note, noteHindi: value.hindi.trim() || null };
}
