import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import type { ClothTypeDraft } from '../../repositories/clothTypeRepo';
import { deleteClothPhoto } from '../../storage/clothImageStore';
import { clothHindi } from '../../utils/clothHindi';
import {
  CLOTH_TYPE_NAME_MAX_LENGTH,
  validateClothType,
} from '../../utils/clothTypes';
import { RUPEE_LIMITS } from '../../utils/inputFilters';
import { paiseToInput } from '../../utils/money';
import { Button } from '../Button';
import { ClothPhotoField } from '../ClothPhotoField';
import { TextField } from '../TextField';

interface ClothTypeSheetProps {
  visible: boolean;
  /** The type being changed; null is a new one. */
  editing: ClothTypeDraft | null;
  /** The names the cloth's other types have, which this one can't take. */
  otherNames: string[];
  /** The rate a new type starts from: the cloth's own, if it is known yet. */
  startPricePaise?: number | null;
  onSave: (draft: ClothTypeDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/**
 * Adds a type of a cloth or changes one: its name, its own price per meter, and
 * if wanted its own photo. Used both by the cloth's form, which keeps the type
 * until the cloth is saved, and by the cloth's page, which saves it at once.
 */
export const ClothTypeSheet: React.FC<ClothTypeSheetProps> = ({
  visible,
  editing,
  otherNames,
  startPricePaise,
  onSave,
  onDelete,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageName, setImageName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // A photo taken here belongs to nothing until the type is saved.
  const picked = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(editing?.name ?? '');
    setPrice(
      editing
        ? paiseToInput(editing.pricePerMeterPaise)
        : startPricePaise
          ? paiseToInput(startPricePaise)
          : ''
    );
    setImageName(editing?.imageName ?? null);
    setSubmitted(false);
    picked.current = null;
  }, [visible, editing, startPricePaise]);

  const dropPicked = (): void => {
    if (picked.current) deleteClothPhoto(picked.current);
    picked.current = null;
  };

  const changePhoto = (next: string | null): void => {
    dropPicked();
    picked.current = next;
    setImageName(next);
  };

  const close = (): void => {
    dropPicked();
    onClose();
  };

  const validation = validateClothType(name, price, otherNames);
  const errors = submitted && !validation.ok ? validation.errors : {};
  const hindi = clothHindi(name.trim(), null);

  const save = (): void => {
    setSubmitted(true);
    if (!validation.ok) return;
    // It belongs to the type now.
    picked.current = null;
    onSave({
      id: editing?.id,
      name: validation.name,
      pricePerMeterPaise: validation.pricePerMeterPaise,
      imageName,
    });
  };

  const confirmDelete = (): void => {
    Alert.alert(
      t('Delete {0}?', editing?.name ?? t('this type')),
      t(
        'Bills already made keep it. Its QR label will open the cloth instead.'
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: () => {
            dropPicked();
            onDelete?.();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityLabel={t('Close')}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text accessibilityRole="header" style={styles.title}>
              {editing ? t('Edit type') : t('Add type')}
            </Text>
            <TextField
              label={t('Type name · प्रकार का नाम')}
              placeholder={t('e.g. Royal Blue')}
              value={name}
              onChangeText={setName}
              error={errors.name}
              maxLength={CLOTH_TYPE_NAME_MAX_LENGTH}
              autoCapitalize="words"
              clearable
            />
            {hindi ? (
              <View style={styles.hindiBox}>
                <Text style={styles.hindiLabel}>
                  {t('हिंदी नाम · Hindi name')}
                </Text>
                <Text style={styles.hindiName}>{hindi}</Text>
              </View>
            ) : null}
            <TextField
              label={t('Price per meter · प्रति मीटर कीमत')}
              placeholder="0"
              size="large"
              prefix="₹ "
              suffix={t(' / meter')}
              value={price}
              onChangeText={setPrice}
              error={errors.price}
              decimal={RUPEE_LIMITS}
            />
            <ClothPhotoField imageName={imageName} onChange={changePhoto} />
            <Button
              label={editing ? t('Save type') : t('Add type')}
              icon="checkmark"
              onPress={save}
            />
            {editing && onDelete ? (
              <Button
                label={t('Delete type')}
                icon="trash-outline"
                variant="danger"
                onPress={confirmDelete}
              />
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '94%',
    alignSelf: 'center',
    paddingTop: 10,
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
    marginBottom: 6,
  },
  content: { paddingHorizontal: 20, paddingTop: 6, gap: 14 },
  title: { ...TYPE.title, color: COLORS.textPrimary },
  // The Hindi the name works out to, made as it is typed.
  hindiBox: {
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hindiLabel: { ...TYPE.caption, color: COLORS.textSecondary },
  hindiName: { ...TYPE.heading, fontSize: 17, color: COLORS.textPrimary },
}));
