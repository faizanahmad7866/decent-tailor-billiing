import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { noteHindi } from '../utils/noteHindi';

interface NoteBlockProps {
  /** The note in English; nothing is shown without one. */
  note: string | null;
  /** The Hindi saved with it, if any; otherwise it is worked out. */
  saved: string | null;
}

/** A note as it is read: the English, and its Hindi under it. */
export const NoteBlock: React.FC<NoteBlockProps> = ({ note, saved }) => {
  if (!note) return null;
  const hindi = noteHindi(note, saved);
  return (
    <View style={styles.block}>
      <Ionicons
        name="document-text-outline"
        size={20}
        color={COLORS.goldText}
        style={styles.icon}
      />
      <View style={styles.text}>
        <Text style={styles.note}>{note}</Text>
        {hindi ? <Text style={styles.hindi}>{hindi}</Text> : null}
      </View>
    </View>
  );
};

const styles = themedStyles(() => ({
  block: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.goldTint,
  },
  icon: { marginTop: 1 },
  text: { flex: 1, gap: 4 },
  note: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  hindi: { ...TYPE.body, color: COLORS.textSecondary },
}));
