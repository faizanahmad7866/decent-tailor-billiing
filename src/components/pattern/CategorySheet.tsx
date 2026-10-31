import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import {
  CATEGORY_NAME_MAX_LENGTH,
  validateCategoryName,
} from '../../utils/patternForm';
import { Button } from '../Button';
import { TextField } from '../TextField';

interface CategorySheetProps {
  visible: boolean;
  /** The name to change; null when adding a new category. */
  editing: string | null;
  /** Another category already has the name just saved. */
  nameTaken: string | null;
  onSave: (name: string) => void;
  /** Only offered when editing: removes the category and everything in it. */
  onDelete: () => void;
  onClose: () => void;
}

/** Adds a category, or renames one — and, from there, deletes it. */
export const CategorySheet: React.FC<CategorySheetProps> = ({
  visible,
  editing,
  nameTaken,
  onSave,
  onDelete,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Opens with the current name, ready to change.
  useEffect(() => {
    if (!visible) return;
    setName(editing ?? '');
    setSubmitted(false);
  }, [visible, editing]);

  const checked = validateCategoryName(name);
  const error =
    submitted && !checked.ok
      ? checked.error
      : nameTaken &&
          checked.ok &&
          checked.name.toLowerCase() === nameTaken.toLowerCase()
        ? t('“{0}” is already a category', nameTaken)
        : undefined;

  const save = (): void => {
    setSubmitted(true);
    if (checked.ok) onSave(checked.name);
  };

  const confirmDelete = (): void =>
    Alert.alert(
      t('Delete {0}?', editing ?? ''),
      t(
        'Every design in it, with its photos and video, is deleted too. This cannot be undone.'
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Delete'), style: 'destructive', onPress: onDelete },
      ]
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('Close')}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <Text accessibilityRole="header" style={styles.title}>
            {editing === null ? t('New category') : t('Edit category')}
          </Text>
          <TextField
            label={t('Category name · श्रेणी का नाम')}
            placeholder={t('e.g. Jodhpuri, Coat')}
            value={name}
            onChangeText={setName}
            error={error}
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={save}
            autoFocus
          />
          <Button
            label={editing === null ? t('Add category') : t('Save')}
            icon="checkmark"
            onPress={save}
          />
          {editing !== null ? (
            <Button
              label={t('Delete category')}
              icon="trash-outline"
              variant="danger"
              onPress={confirmDelete}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = themedStyles(() => ({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.backdrop,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  title: {
    ...TYPE.title,
    fontSize: 21,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
}));
