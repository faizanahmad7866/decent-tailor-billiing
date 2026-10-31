import React from 'react';
import { View } from 'react-native';
import { t } from '../i18n/t';
import {
  NOTE_MAX_LENGTH,
  typeNote,
  typeNoteHindi,
  type NoteValue,
} from '../utils/noteForm';
import { TextField } from './TextField';

interface NoteFieldProps {
  value: NoteValue;
  onChange: (value: NoteValue) => void;
  placeholder?: string;
}

/**
 * An optional note and its Hindi: the Hindi is written from the English as it
 * is typed, in a box of its own that can be corrected by hand — and then
 * stays — the way a cloth's Hindi name is.
 */
export const NoteField: React.FC<NoteFieldProps> = ({
  value,
  onChange,
  placeholder = t('e.g. Dry clean only'),
}) => (
  <View style={{ gap: 16 }}>
    <TextField
      label={t('Note (optional) · नोट')}
      placeholder={placeholder}
      value={value.text}
      onChangeText={(text) => onChange(typeNote(value, text))}
      maxLength={NOTE_MAX_LENGTH}
      multiline
      autoCapitalize="sentences"
    />
    {value.text.trim() ? (
      <TextField
        label={t('Hindi note (auto) · हिंदी नोट')}
        placeholder={t('हिंदी नोट')}
        hint={t(
          'Written for you from the English note — change it if you like'
        )}
        value={value.hindi}
        onChangeText={(hindi) => onChange(typeNoteHindi(value, hindi))}
        maxLength={NOTE_MAX_LENGTH * 2}
        multiline
        clearable
      />
    ) : null}
  </View>
);
