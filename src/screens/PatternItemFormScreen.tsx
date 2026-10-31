import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { AmountRow } from '../components/AmountRow';
import { ClothLineEditor } from '../components/bill/ClothLineEditor';
import { ClothPicker } from '../components/bill/ClothPicker';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import { PatternMediaField } from '../components/pattern/PatternMediaField';
import { NoteField } from '../components/NoteField';
import { Section } from '../components/Section';
import { Tap } from '../components/Tap';
import { TextField } from '../components/TextField';
import { LABEL } from '../constants/labels';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { PageColumn, PageColumns, usePagePadding } from '../layout/Page';
import { useLayout } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import { clothRate, type ClothEntry } from '../utils/billForm';
import {
  garmentRateRepo,
  type GarmentRate,
} from '../repositories/garmentRateRepo';
import type { Cloth } from '../repositories/clothRepo';
import { patternRepo, type PatternCategory } from '../repositories/patternRepo';
import { deletePatternMedia } from '../storage/patternMediaStore';
import { haptics } from '../utils/haptics';
import { RUPEE_LIMITS } from '../utils/inputFilters';
import {
  formatMeters,
  metersToInput,
  parseMeters,
  totalLengthCm,
} from '../utils/billMath';
import {
  formatRupees,
  paiseToInput,
  paiseToSignedInput,
  parseRupees,
} from '../utils/money';
import { designHindi } from '../utils/designHindi';
import {
  EMPTY_NOTE,
  loadNote,
  noteToSave,
  type NoteValue,
} from '../utils/noteForm';
import {
  designPriceText,
  patternPrice,
  shownPrice,
} from '../utils/patternPricing';
import {
  PATTERN_NAME_MAX_LENGTH,
  validatePatternItem,
  type PatternItemErrors,
} from '../utils/patternForm';

interface FormValues {
  categoryId: number | null;
  name: string;
  cloths: ClothEntry[];
  /** The stitching charge as typed. */
  stitching: string;
  note: NoteValue;
  images: string[];
  videoName: string | null;
}

const EMPTY: FormValues = {
  categoryId: null,
  name: '',
  cloths: [],
  stitching: '',
  note: EMPTY_NOTE,
  images: [],
  videoName: null,
};

const NO_ERRORS: PatternItemErrors = { extras: [], meters: [] };

/**
 * Adds a design to a category, or changes one: its name, the cloths it needs
 * and how many meters of each, its stitching charge, up to three photos and
 * one video. Its price is not typed — it is the cloths at their rates plus
 * the stitching, shown as the form is filled in. Photos and the video are
 * picked into the app's own folder as they are chosen; any not saved by the
 * time the form is left are deleted again.
 */
export const PatternItemFormScreen: React.FC<
  RootScreenProps<'PatternItemForm'>
> = ({ navigation, route }) => {
  const pagePadding = usePagePadding({ footer: true });
  const { pageMaxWidth } = useLayout();
  const { itemId, categoryId: startCategoryId } = route.params;
  const editing = itemId !== undefined;

  const [categories, setCategories] = useState<PatternCategory[]>([]);
  const [form, setForm] = useState<FormValues>({
    ...EMPTY,
    categoryId: startCategoryId ?? null,
  });
  // What the form started as; leaving with anything different asks first.
  const [baseline, setBaseline] = useState<FormValues | null>(
    editing ? null : form
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [pickingCloth, setPickingCloth] = useState(false);
  // The price of an old design given one by hand, with no cloth or stitching:
  // what it comes to until some are added.
  const [givenPaise, setGivenPaise] = useState(0);
  // The cloth line to open with the keyboard up: the one just added.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [rateMaster, setRateMaster] = useState<GarmentRate[]>([]);
  const stitchingInput = useRef<TextInput>(null);
  // Set once the tailor has typed a stitching charge: the Rate Master's no
  // longer fills it in.
  const stitchingTyped = useRef(false);
  const lastKey = useRef(0);
  const nextKey = (): string => String(++lastKey.current);

  // Files picked in this form and not yet saved with the item.
  const picked = useRef(new Set<string>());
  const saved = useRef(false);

  useEffect(
    () => () => {
      if (!saved.current) picked.current.forEach(deletePatternMedia);
    },
    []
  );

  useEffect(() => {
    patternRepo.listCategories().then(setCategories, () => {});
    garmentRateRepo.list().then(setRateMaster, () => {});
  }, []);

  useEffect(() => {
    if (itemId === undefined) return;
    let active = true;
    patternRepo
      .getItem(itemId)
      .then((item) => {
        if (!active) return;
        if (!item) throw new Error('Design not found');
        const loaded: FormValues = {
          categoryId: item.categoryId,
          name: item.name,
          cloths: item.cloths.map((cloth) => ({
            key: nextKey(),
            clothId: cloth.clothId,
            clothName: cloth.clothName,
            clothNameHindi: cloth.nameHindi,
            imageName: cloth.imageName,
            // The catalog rate, before the extra, as a bill line keeps it.
            pricePerMeterPaise:
              cloth.pricePerMeterPaise - cloth.extraPerMeterPaise,
            variant: cloth.variant ?? '',
            extra: cloth.extraPerMeterPaise
              ? paiseToSignedInput(cloth.extraPerMeterPaise)
              : '',
            meters: metersToInput(cloth.lengthCm),
          })),
          stitching: item.stitchingPaise
            ? paiseToInput(item.stitchingPaise)
            : '',
          note: loadNote(item.note, item.noteHindi),
          images: item.images,
          videoName: item.videoName,
        };
        stitchingTyped.current = true;
        if (!item.cloths.length && !item.stitchingPaise) {
          setGivenPaise(item.pricePaise);
        }
        setForm(loaded);
        setBaseline(loaded);
      })
      .catch(() => {
        if (!active) return;
        Alert.alert(t('Design not found'), t('It may have been deleted.'));
        navigation.goBack();
      });
    return () => {
      active = false;
    };
  }, [itemId, navigation]);

  useEffect(() => {
    if (finished) navigation.goBack();
  }, [finished, navigation]);

  const dirty =
    baseline !== null && JSON.stringify(form) !== JSON.stringify(baseline);

  usePreventRemove(dirty && !finished, ({ data }) => {
    Alert.alert(
      t('Discard changes?'),
      t("What you've entered won't be saved."),
      [
        { text: t('Keep editing'), style: 'cancel' },
        {
          text: t('Discard'),
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ]
    );
  });

  const update = (patch: Partial<FormValues>): void =>
    setForm((current) => ({ ...current, ...patch }));

  // The Rate Master's charge for the garment this category is named for (a
  // Jodhpuri's, a coat's), offered as the stitching charge.
  const categoryName = categories.find((c) => c.id === form.categoryId)?.name;
  const suggested = rateMaster.find(
    (rate) => rate.name.toLowerCase() === categoryName?.toLowerCase()
  )?.makingPaise;

  // Filled in for a new design until the tailor types their own. It is part of
  // the form as it started, so it does not count as a change to discard.
  useEffect(() => {
    if (editing || stitchingTyped.current || suggested === undefined) return;
    const text = paiseToInput(suggested);
    setForm((current) =>
      current.stitching === text ? current : { ...current, stitching: text }
    );
    setBaseline((current) =>
      current && current.stitching !== text
        ? { ...current, stitching: text }
        : current
    );
  }, [editing, suggested]);

  // Every cloth ticked in the picker becomes a line, once: a cloth already on
  // the design is not added again.
  const addCloths = (picked: Cloth[]): void => {
    setPickingCloth(false);
    setForm((current) => {
      const have = new Set(current.cloths.map((c) => c.clothId));
      const added = picked
        .filter((cloth) => !have.has(cloth.id))
        .map((cloth) => ({
          key: nextKey(),
          clothId: cloth.id,
          clothName: cloth.name,
          clothNameHindi: cloth.nameHindi,
          imageName: cloth.imageName,
          pricePerMeterPaise: cloth.pricePerMeterPaise,
          variant: '',
          extra: '',
          meters: '',
        }));
      // The last cloth added opens on its first box, ready to type in.
      if (added.length) setFocusKey(added[added.length - 1].key);
      return { ...current, cloths: [...current.cloths, ...added] };
    });
  };

  const updateCloth = (key: string, patch: Partial<ClothEntry>): void =>
    setForm((current) => ({
      ...current,
      cloths: current.cloths.map((c) =>
        c.key === key ? { ...c, ...patch } : c
      ),
    }));

  const removeCloth = (key: string): void =>
    setForm((current) => ({
      ...current,
      cloths: current.cloths.filter((c) => c.key !== key),
    }));

  const addImage = (imageName: string): void => {
    picked.current.add(imageName);
    setForm((current) => ({
      ...current,
      images: [...current.images, imageName],
    }));
  };

  // A photo picked here and removed again was never saved: it goes now. One
  // that was already on the design goes when the change is saved.
  const removeImage = (imageName: string): void => {
    if (picked.current.delete(imageName)) deletePatternMedia(imageName);
    setForm((current) => ({
      ...current,
      images: current.images.filter((name) => name !== imageName),
    }));
  };

  // A cropped photo is a new file in the old one's place. The old one goes now if it
  // was picked here; if it was already on the design, when the change is saved, so
  // leaving without saving still has it.
  const replaceImage = (oldName: string, newName: string): void => {
    if (picked.current.delete(oldName)) deletePatternMedia(oldName);
    picked.current.add(newName);
    setForm((current) => ({
      ...current,
      images: current.images.map((name) => (name === oldName ? newName : name)),
    }));
  };

  const changeVideo = (videoName: string | null): void => {
    const old = form.videoName;
    if (old && picked.current.delete(old)) deletePatternMedia(old);
    if (videoName) picked.current.add(videoName);
    update({ videoName });
  };

  const validation = validatePatternItem(
    form.name,
    form.cloths,
    form.stitching
  );
  const errors = submitted && !validation.ok ? validation.errors : NO_ERRORS;
  // What it comes to so far, as the form is filled in.
  const pricedCloths = form.cloths.map((cloth) => ({
    pricePerMeterPaise: clothRate(cloth),
    lengthCm: parseMeters(cloth.meters) ?? 0,
  }));
  const stitchingPaise = parseRupees(form.stitching) ?? 0;
  const price = patternPrice(pricedCloths, stitchingPaise);
  const totalPaise = shownPrice(pricedCloths, stitchingPaise, givenPaise);

  const handleSave = async (): Promise<void> => {
    setSubmitted(true);
    if (!validation.ok || form.categoryId === null) {
      haptics.error();
      return;
    }
    Keyboard.dismiss();
    setSaving(true);
    const input = {
      categoryId: form.categoryId,
      name: validation.name,
      cloths: form.cloths.map((cloth, index) => ({
        clothId: cloth.clothId,
        clothName: cloth.clothName,
        pricePerMeterPaise: cloth.pricePerMeterPaise,
        variant: cloth.variant.trim() || null,
        extraPerMeterPaise: validation.extrasPaise[index],
        lengthCm: validation.lengthsCm[index],
      })),
      stitchingPaise: validation.stitchingPaise,
      ...noteToSave(form.note),
      images: form.images,
      videoName: form.videoName,
    };
    try {
      if (itemId === undefined) await patternRepo.createItem(input);
      else await patternRepo.updateItem(itemId, input);
      saved.current = true;
      haptics.success();
      setFinished(true);
    } catch {
      haptics.error();
      Alert.alert(
        t('Not saved'),
        t('The design could not be saved. Try again.')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (): void => {
    if (itemId === undefined) return;
    Alert.alert(
      t('Delete {0}?', baseline?.name || t('this design')),
      t('Its photos and video are deleted too. This cannot be undone.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await patternRepo.removeItem(itemId);
              saved.current = true;
              haptics.success();
              setFinished(true);
            } catch {
              haptics.error();
              Alert.alert(
                t('Not deleted'),
                t('The design could not be deleted. Try again.')
              );
            }
          },
        },
      ]
    );
  };

  if (baseline === null) {
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
        <PageColumn wide>
          <PageColumns
            first={
              <>
                <Section title={t('Category · श्रेणी')}>
                  <View style={styles.pills}>
                    {categories.map((category) => {
                      const selected = category.id === form.categoryId;
                      return (
                        <Tap
                          key={category.id}
                          onPress={() => update({ categoryId: category.id })}
                          haptic="select"
                          throttle={false}
                          accessibilityLabel={category.name}
                          accessibilityState={{ selected }}
                          style={[styles.pill, selected && styles.pillSelected]}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              selected && styles.pillTextSelected,
                            ]}
                          >
                            {category.name}
                          </Text>
                        </Tap>
                      );
                    })}
                  </View>
                  {submitted && form.categoryId === null ? (
                    <Text style={styles.error}>{t('Choose a category')}</Text>
                  ) : null}
                </Section>

                <Section title={t('Design · डिज़ाइन')}>
                  <TextField
                    label={t('Name · नाम')}
                    placeholder={t('e.g. Royal Jodhpuri Suit')}
                    value={form.name}
                    onChangeText={(name) => update({ name })}
                    error={errors.name}
                    maxLength={PATTERN_NAME_MAX_LENGTH}
                    autoCapitalize="words"
                  />
                  {designHindi(form.name) ? (
                    <View style={styles.hindiPreview}>
                      <Text style={styles.hindiLabel}>
                        {t('हिंदी नाम · Hindi name')}
                      </Text>
                      <Text style={styles.hindiName}>
                        {designHindi(form.name)}
                      </Text>
                    </View>
                  ) : null}
                </Section>

                <Section
                  title={t('Cloth needed · कपड़ा (optional)')}
                  aside={
                    form.cloths.length ? (
                      <Text style={styles.metersTotal}>
                        {t(
                          '{0} in all',
                          formatMeters(
                            totalLengthCm(
                              form.cloths.map((cloth) => ({
                                lengthCm: parseMeters(cloth.meters) ?? 0,
                              }))
                            )
                          )
                        )}
                      </Text>
                    ) : null
                  }
                >
                  {form.cloths.length === 0 ? (
                    <Text style={styles.hint}>
                      {t(
                        'Optional. Choose the cloths this design is made from, and the meters of each, and its price is worked out from them. With no cloth or stitching, it shows “Ask for price”.'
                      )}
                    </Text>
                  ) : null}
                  {form.cloths.map((cloth, index) => (
                    <React.Fragment key={cloth.key}>
                      {index > 0 ? <View style={styles.divider} /> : null}
                      <ClothLineEditor
                        autoFocus={cloth.key === focusKey}
                        entry={cloth}
                        errors={{
                          extra: errors.extras[index],
                          meters: errors.meters[index],
                        }}
                        onChange={(patch) => updateCloth(cloth.key, patch)}
                        onRemove={() => removeCloth(cloth.key)}
                      />
                    </React.Fragment>
                  ))}
                  <Button
                    label={
                      form.cloths.length
                        ? t('Add another cloth')
                        : t('Select cloth')
                    }
                    icon="add"
                    variant="tonal"
                    onPress={() => setPickingCloth(true)}
                  />
                </Section>
              </>
            }
            second={
              <>
                <Section title={t(LABEL.stitching)}>
                  <TextField
                    ref={stitchingInput}
                    label={t('Stitching charge · सिलाई')}
                    placeholder="0"
                    prefix="₹ "
                    size="large"
                    hint={
                      suggested !== undefined
                        ? t(
                            'Rate Master charge for {0}: {1}',
                            categoryName ?? '',
                            formatRupees(suggested)
                          )
                        : t('What the stitching of this design costs')
                    }
                    value={form.stitching}
                    onChangeText={(stitching) => {
                      stitchingTyped.current = true;
                      update({ stitching });
                    }}
                    error={errors.stitching}
                    decimal={RUPEE_LIMITS}
                    returnKeyType="done"
                  />
                </Section>

                <Section title={t(LABEL.price)}>
                  <View style={styles.amounts}>
                    <AmountRow
                      label={t(LABEL.cloth)}
                      paise={price.clothPaise}
                    />
                    <AmountRow
                      label={t(LABEL.stitching)}
                      paise={price.stitchingPaise}
                    />
                    <AmountRow
                      label={t(LABEL.price)}
                      paise={totalPaise}
                      emphasis
                    />
                  </View>
                  <Text style={styles.hint}>
                    {t(
                      "Worked out from the cloth and the stitching, so it moves with the catalog's rates."
                    )}
                  </Text>
                </Section>

                <Section title={t('Note · नोट')}>
                  <NoteField
                    value={form.note}
                    onChange={(note) => update({ note })}
                    placeholder={t('e.g. Made to order, ready in 7 days')}
                  />
                </Section>

                <Section title={t('Photos & video')}>
                  <PatternMediaField
                    images={form.images}
                    videoName={form.videoName}
                    onAddImage={addImage}
                    onRemoveImage={removeImage}
                    onReplaceImage={replaceImage}
                    onVideoChange={changeVideo}
                  />
                </Section>

                {editing ? (
                  <Button
                    label={t('Delete design')}
                    icon="trash-outline"
                    variant="danger"
                    onPress={handleDelete}
                    disabled={saving}
                  />
                ) : null}
              </>
            }
          />
        </PageColumn>
      </KeyboardAwareScroll>

      <Footer maxWidth={pageMaxWidth}>
        <View style={styles.footerRow}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerLabel}>{t(LABEL.price)}</Text>
            <Text numberOfLines={1} style={styles.footerAmount}>
              {t(designPriceText(totalPaise))}
            </Text>
          </View>
          <Button
            label={editing ? t('Save changes') : t('Save design')}
            icon="checkmark"
            onPress={() => void handleSave()}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </Footer>

      <ClothPicker
        visible={pickingCloth}
        onClose={() => setPickingCloth(false)}
        onConfirm={addCloths}
        onAddCloth={() => {
          setPickingCloth(false);
          navigation.navigate('ClothForm');
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryTint,
  },
  pillSelected: { backgroundColor: COLORS.primary },
  pillText: { ...TYPE.label, fontSize: 14, color: COLORS.accent },
  pillTextSelected: { color: COLORS.onPrimary },
  error: { ...TYPE.caption, color: COLORS.danger },
  hint: { ...TYPE.body, color: COLORS.textSecondary },
  // The Hindi the name works out to, made as it is typed.
  hindiPreview: {
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryWash,
    borderWidth: 1,
    borderColor: COLORS.primaryTintStrong,
  },
  hindiLabel: { ...TYPE.caption, color: COLORS.textSecondary },
  hindiName: { ...TYPE.title, fontSize: 19, color: COLORS.textPrimary },
  metersTotal: { ...TYPE.label, color: COLORS.accent },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  amounts: { gap: 10 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  footerTotal: { flex: 1 },
  footerLabel: { ...TYPE.caption, color: COLORS.textSecondary },
  footerAmount: {
    ...TYPE.title,
    fontVariant: ['tabular-nums'],
    color: COLORS.textPrimary,
  },
  saveButton: { minWidth: 160 },
}));
