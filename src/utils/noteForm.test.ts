import {
  EMPTY_NOTE,
  loadNote,
  normalizeNote,
  noteToSave,
  typeNote,
  typeNoteHindi,
} from './noteForm';

describe('normalizeNote', () => {
  it('drops stray spaces and blank lines at the ends', () => {
    expect(normalizeNote('  Dry   clean\n  only \n')).toBe('Dry clean\nonly');
    expect(normalizeNote('   ')).toBe('');
  });
});

describe('typeNote', () => {
  it('writes the Hindi as the note is typed', () => {
    const value = typeNote(EMPTY_NOTE, 'Dry clean only');
    expect(value).toEqual({
      text: 'Dry clean only',
      hindi: 'ड्राई क्लीन ओनली',
      hindiEdited: false,
    });
  });

  it('keeps a Hindi the tailor wrote by hand when the note changes', () => {
    const own = typeNoteHindi(
      typeNote(EMPTY_NOTE, 'Dry clean'),
      'सिर्फ ड्राई क्लीन'
    );
    expect(own.hindiEdited).toBe(true);
    expect(typeNote(own, 'Dry clean only').hindi).toBe('सिर्फ ड्राई क्लीन');
  });

  it('hands the Hindi back to the automatic one when it is cleared', () => {
    const own = typeNoteHindi(typeNote(EMPTY_NOTE, 'Dry clean'), 'कुछ');
    const cleared = typeNoteHindi(own, '');
    expect(cleared.hindiEdited).toBe(false);
    expect(typeNote(cleared, 'Dry clean only').hindi).toBe('ड्राई क्लीन ओनली');
  });
});

describe('loadNote', () => {
  it('opens a note with no Hindi saved on its automatic Hindi', () => {
    expect(loadNote('Dry clean only', null)).toEqual({
      text: 'Dry clean only',
      hindi: 'ड्राई क्लीन ओनली',
      hindiEdited: false,
    });
  });

  it('knows a saved Hindi that differs from the automatic one is by hand', () => {
    expect(loadNote('Dry clean only', 'सिर्फ ड्राई क्लीन').hindiEdited).toBe(
      true
    );
    expect(loadNote('Dry clean only', 'ड्राई क्लीन ओनली').hindiEdited).toBe(
      false
    );
  });

  it('opens no note as an empty one', () => {
    expect(loadNote(null, null)).toEqual(EMPTY_NOTE);
  });
});

describe('noteToSave', () => {
  it('saves the tidied note and its Hindi', () => {
    expect(noteToSave(typeNote(EMPTY_NOTE, '  Dry  clean only '))).toEqual({
      note: 'Dry clean only',
      noteHindi: 'ड्राई क्लीन ओनली',
    });
  });

  it('saves nothing for a blank note, whatever its Hindi', () => {
    expect(noteToSave({ text: '  ', hindi: 'कुछ', hindiEdited: true })).toEqual(
      { note: null, noteHindi: null }
    );
  });
});
