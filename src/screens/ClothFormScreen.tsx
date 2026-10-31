import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  View,
  type TextInput,
} from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import { ClothPhotoField } from '../components/ClothPhotoField';
import { TextField } from '../components/TextField';
import { COLORS } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { usePagePadding } from '../layout/Page';
import { FORM_MAX_WIDTH } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import { clothRepo, DuplicateClothNameError } from '../repositories/clothRepo';
import { deleteClothPhoto } from '../storage/clothImageStore';
import {
  CLOTH_NAME_MAX_LENGTH,
  normalizeClothName,
  validateClothForm,
} from '../utils/clothForm';
import { haptics } from '../utils/haptics';
import { clothNameToHindi } from '../utils/clothHindi';
import {
  EMPTY_NOTE,
  loadNote,
  noteToSave,
  type NoteValue,
} from '../utils/noteForm';
import { NoteField } from '../components/NoteField';
import { ClothTypeRow } from '../components/cloth/ClothTypeRow';
import { ClothTypeSheet } from '../components/cloth/ClothTypeSheet';
import { Section } from '../components/Section';
import {
  clothTypeRepo,
  type ClothTypeDraft,
} from '../repositories/clothTypeRepo';
import { RUPEE_LIMITS } from '../utils/inputFilters';
import { paiseToInput, parseRupees } from '../utils/money';

interface FormValues {
  name: string;
  /** The Hindi name: written from `name` as it is typed, until changed by hand. */
  hindi: string;
  /** The tailor has typed their own Hindi, so typing the name no longer rewrites it. */
  hindiEdited: boolean;
  price: string;
  imageName: string | null;
  note: NoteValue;
  /** Its types, as they will be saved with it. */
  types: ClothTypeDraft[];
}

const EMPTY_FORM: FormValues = {
  name: '',
  hindi: '',
  hindiEdited: false,
  price: '',
  imageName: null,
  note: EMPTY_NOTE,
  types: [],
};

// On a tablet the form keeps to a comfortable column instead of stretching
// its fields across the whole screen.

export const ClothFormScreen: React.FC<RootScreenProps<'ClothForm'>> = ({
  navigation,
  route,
}) => {
  const clothId = route.params?.clothId;
  const isEditing = clothId !== undefined;
  const priceInput = useRef<TextInput>(null);

  // What the form started from — blank for a new cloth, the saved cloth when
  // editing (null until it has loaded). Leaving with anything different asks
  // first.
  const pagePadding = usePagePadding({ footer: true });
  const [original, setOriginal] = useState<FormValues | null>(
    isEditing ? null : EMPTY_FORM
  );
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  // Errors stay hidden until the first Save, so the form doesn't scold the
  // tailor for fields they haven't reached yet.
  const [submitted, setSubmitted] = useState(false);
  const [takenName, setTakenName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // The type sheet: null closed, no index for a new type.
  const [editingType, setEditingType] = useState<{ index?: number } | null>(
    null
  );
  const [finished, setFinished] = useState(false);
  // Set when a new cloth was just made: its QR page opens in place of the form.
  const [createdClothId, setCreatedClothId] = useState<number | null>(null);

  useEffect(() => {
    if (clothId === undefined) return;
    let active = true;
    Promise.all([clothRepo.get(clothId), clothTypeRepo.list(clothId)])
      .then(([cloth, types]) => {
        if (!active) return;
        if (!cloth) throw new Error('Cloth not found');
        const auto = clothNameToHindi(cloth.name);
        const loaded: FormValues = {
          name: cloth.name,
          hindi: cloth.nameHindi ?? auto,
          // A Hindi name that differs from what the English works out to was
          // put there by hand, and stays when the name is touched.
          hindiEdited: cloth.nameHindi !== null && cloth.nameHindi !== auto,
          price: paiseToInput(cloth.pricePerMeterPaise),
          imageName: cloth.imageName,
          note: loadNote(cloth.note, cloth.noteHindi),
          types: types.map(({ id, name, pricePerMeterPaise, imageName }) => ({
            id,
            name,
            pricePerMeterPaise,
            imageName,
          })),
        };
        setOriginal(loaded);
        setValues(loaded);
      })
      .catch(() => {
        if (!active) return;
        Alert.alert(t('Cloth not found'), t('It may have been deleted.'));
        navigation.goBack();
      });
    return () => {
      active = false;
    };
  }, [clothId, navigation]);

  useEffect(() => {
    if (!finished) return;
    if (createdClothId === null) navigation.goBack();
    else {
      navigation.replace('ClothDetail', {
        clothId: createdClothId,
        justAdded: true,
      });
    }
  }, [finished, createdClothId, navigation]);

  const isDirty =
    original !== null &&
    (values.name !== original.name ||
      values.hindi !== original.hindi ||
      values.price !== original.price ||
      values.imageName !== original.imageName ||
      values.note.text !== original.note.text ||
      values.note.hindi !== original.note.hindi ||
      JSON.stringify(values.types) !== JSON.stringify(original.types));

  // A photo taken on this form belongs to nothing until the cloth is saved,
  // so it is deleted as soon as it is replaced or the form is abandoned.
  // The saved cloth's own photo is left alone — the repo lets go of that
  // one, and only once the change is saved.
  const dropUnsavedPhoto = (imageName: string | null): void => {
    if (imageName && imageName !== original?.imageName) {
      deleteClothPhoto(imageName);
    }
  };

  // The same for a type's photo: one the saved type already had stays until
  // the change is saved, and the repo lets go of it then.
  const dropUnsavedTypePhoto = (imageName: string | null): void => {
    if (
      imageName &&
      !original?.types.some((type) => type.imageName === imageName)
    ) {
      deleteClothPhoto(imageName);
    }
  };

  const saveType = (draft: ClothTypeDraft): void => {
    const index = editingType?.index;
    if (index !== undefined) {
      const before = values.types[index]?.imageName ?? null;
      if (before !== draft.imageName) dropUnsavedTypePhoto(before);
    }
    setValues((current) => ({
      ...current,
      types:
        index === undefined
          ? [...current.types, draft]
          : current.types.map((type, i) => (i === index ? draft : type)),
    }));
    setEditingType(null);
  };

  const removeType = (): void => {
    const index = editingType?.index;
    if (index === undefined) return;
    dropUnsavedTypePhoto(values.types[index]?.imageName ?? null);
    setValues((current) => ({
      ...current,
      types: current.types.filter((_, i) => i !== index),
    }));
    setEditingType(null);
  };

  usePreventRemove(isDirty && !finished, ({ data }) => {
    Alert.alert(
      t('Discard changes?'),
      t("What you've entered won't be saved."),
      [
        { text: t('Keep editing'), style: 'cancel' },
        {
          text: t('Discard'),
          style: 'destructive',
          onPress: () => {
            dropUnsavedPhoto(values.imageName);
            values.types.forEach((type) =>
              dropUnsavedTypePhoto(type.imageName)
            );
            navigation.dispatch(data.action);
          },
        },
      ]
    );
  });

  const validation = validateClothForm(values.name, values.price);
  const errors = submitted && !validation.ok ? validation.errors : {};
  const nameTaken =
    takenName !== null &&
    normalizeClothName(values.name).toLowerCase() === takenName.toLowerCase();

  const setField = (field: 'price', text: string): void =>
    setValues((current) => ({ ...current, [field]: text }));

  // The Hindi follows the English name as it is typed — until the tailor
  // writes their own, which then stays.
  const setName = (name: string): void =>
    setValues((current) => ({
      ...current,
      name,
      hindi: current.hindiEdited
        ? current.hindi
        : clothNameToHindi(normalizeClothName(name)),
    }));

  // Clearing the Hindi hands it back to the automatic one for the next edit.
  const setHindi = (hindi: string): void =>
    setValues((current) => ({
      ...current,
      hindi,
      hindiEdited: hindi.trim() !== '',
    }));

  const changePhoto = (imageName: string | null): void => {
    dropUnsavedPhoto(values.imageName);
    setValues((current) => ({ ...current, imageName }));
  };

  const handleSave = async (): Promise<void> => {
    setSubmitted(true);
    if (!validation.ok || nameTaken) {
      haptics.error();
      return;
    }

    Keyboard.dismiss();
    setSaving(true);
    const input = {
      name: validation.name,
      // Blank is saved as none, and the cloth shows what its name works out to.
      nameHindi: values.hindi.trim() || null,
      pricePerMeterPaise: validation.pricePerMeterPaise,
      imageName: values.imageName,
      ...noteToSave(values.note),
    };
    try {
      if (clothId === undefined) {
        const newId = await clothRepo.create(input);
        await clothTypeRepo.saveAll(newId, values.types);
        setCreatedClothId(newId);
      } else {
        await clothRepo.update(clothId, input);
        await clothTypeRepo.saveAll(clothId, values.types);
      }
      haptics.success();
      setFinished(true);
    } catch (error) {
      haptics.error();
      if (error instanceof DuplicateClothNameError) {
        setTakenName(input.name);
      } else {
        Alert.alert(
          t('Not saved'),
          t('The cloth could not be saved. Try again.')
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (): void => {
    if (clothId === undefined || !original) return;
    Alert.alert(
      t('Delete {0}?', original.name),
      t('It will be removed from your cloth catalog.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clothRepo.remove(clothId);
              dropUnsavedPhoto(values.imageName);
              haptics.success();
              setFinished(true);
            } catch {
              haptics.error();
              Alert.alert(
                t('Not deleted'),
                t('The cloth could not be deleted. Try again.')
              );
            }
          },
        },
      ]
    );
  };

  if (!original) {
    return (
      <View style={styles.page}>
        <ActivityIndicator color={COLORS.accent} style={styles.loading} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <KeyboardAwareScroll
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={pagePadding}
      >
        <View style={styles.column}>
          <ClothPhotoField
            imageName={values.imageName}
            onChange={changePhoto}
          />

          <TextField
            label={t('Cloth name')}
            placeholder={t('e.g. Raymond Cotton Blue')}
            value={values.name}
            onChangeText={setName}
            error={
              nameTaken
                ? t('“{0}” is already in your catalog', takenName)
                : errors.name
            }
            maxLength={CLOTH_NAME_MAX_LENGTH}
            autoCapitalize="words"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => priceInput.current?.focus()}
          />

          <TextField
            label={t('Hindi name (auto)')}
            placeholder={t('हिंदी नाम')}
            hint={t(
              'Written for you from the English name — change it if you like'
            )}
            value={values.hindi}
            onChangeText={setHindi}
            maxLength={CLOTH_NAME_MAX_LENGTH * 2}
            clearable
          />

          <TextField
            ref={priceInput}
            label={t('Price per meter')}
            placeholder="0"
            size="large"
            prefix="₹ "
            suffix={t(' / meter')}
            hint={t('What you charge the customer for one meter')}
            value={values.price}
            onChangeText={(text) => setField('price', text)}
            error={errors.price}
            decimal={RUPEE_LIMITS}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <NoteField
            value={values.note}
            onChange={(note) => setValues((current) => ({ ...current, note }))}
          />

          <Section
            title={t('Types · प्रकार (optional)')}
            description={t(
              'If this cloth comes in types, each with its own rate'
            )}
          >
            {values.types.map((type, index) => (
              <ClothTypeRow
                key={`${type.name}-${index}`}
                name={type.name}
                pricePerMeterPaise={type.pricePerMeterPaise}
                imageName={type.imageName}
                onEdit={() => setEditingType({ index })}
              />
            ))}
            <Button
              label={t('Add type')}
              icon="add"
              variant="secondary"
              onPress={() => setEditingType({})}
            />
          </Section>

          {isEditing ? (
            <Button
              label={t('Delete cloth')}
              icon="trash-outline"
              variant="danger"
              onPress={handleDelete}
              disabled={saving}
            />
          ) : null}
        </View>
      </KeyboardAwareScroll>

      <Footer maxWidth={FORM_MAX_WIDTH}>
        <Button
          label={isEditing ? t('Save changes') : t('Save cloth')}
          onPress={handleSave}
          loading={saving}
        />
      </Footer>
      <ClothTypeSheet
        visible={editingType !== null}
        editing={
          editingType?.index !== undefined
            ? (values.types[editingType.index] ?? null)
            : null
        }
        otherNames={values.types
          .filter((_, index) => index !== editingType?.index)
          .map((type) => type.name)}
        startPricePaise={parseRupees(values.price)}
        onSave={saveType}
        onDelete={removeType}
        onClose={() => setEditingType(null)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  column: {
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    gap: 24,
  },
}));
