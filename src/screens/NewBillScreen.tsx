import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreventRemove } from '@react-navigation/native';
import { AmountRow } from '../components/AmountRow';
import { ClothScanner } from '../components/ClothScanner';
import { ClothLineEditor } from '../components/bill/ClothLineEditor';
import { LineRow } from '../components/bill/LineRow';
import { ClothPicker } from '../components/bill/ClothPicker';
import { GarmentLineEditor } from '../components/bill/GarmentLineEditor';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Footer } from '../components/Footer';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import { GarmentImage } from '../components/GarmentImage';
import { Section } from '../components/Section';
import { SegmentedControl } from '../components/SegmentedControl';
import { TextField } from '../components/TextField';
import { LABEL } from '../constants/labels';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { PageColumn, PageColumns, usePagePadding } from '../layout/Page';
import { useLayout } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import {
  BillBelowPaymentsError,
  billRepo,
  clothLineName,
} from '../repositories/billRepo';
import { clothRepo, type Cloth } from '../repositories/clothRepo';
import type { ClothType } from '../repositories/clothTypeRepo';
import { patternRepo } from '../repositories/patternRepo';
import {
  garmentRateRepo,
  type GarmentRate,
} from '../repositories/garmentRateRepo';
import {
  draftLines,
  draftTotals,
  EMPTY_BILL_FORM,
  readDiscount,
  formFromBill,
  validateBillForm,
  type BillForm,
  type BillFormErrors,
  type ClothEntry,
  type DiscountMode,
  type GarmentEntry,
} from '../utils/billForm';
import { billLinesFromDesign } from '../utils/designBill';
import {
  DT_VALUE_MAX_LENGTH,
  formatDt,
  normalizeDtValue,
  sanitizeDtInput,
} from '../utils/dtNumber';
import { spokenDiscount } from '../voice/spokenText';
import { useAnnouncer } from '../voice/useAnnouncer';
import { haptics } from '../utils/haptics';
import { animateNextLayout } from '../utils/layoutAnimation';
import { PERCENT_LIMITS, RUPEE_LIMITS } from '../utils/inputFilters';
import { formatMeters, totalLengthCm } from '../utils/billMath';
import { clothLineHindi } from '../utils/clothHindi';
import { formatRupees, paiseToInput, parseRupees } from '../utils/money';

const NO_ERRORS: BillFormErrors = { cloths: {}, garments: {} };

const discountModes = () =>
  [
    { value: 'amount', label: t('₹ Amount') },
    { value: 'percent', label: t('% Percent') },
  ] as const;

export const NewBillScreen: React.FC<RootScreenProps<'NewBill'>> = ({
  navigation,
  route,
}) => {
  // The same form makes a bill and changes one: with an id it opens that bill.
  const pagePadding = usePagePadding({ footer: true });
  const { pageMaxWidth } = useLayout();
  const billId = route.params?.billId;
  const editing = billId !== undefined;
  const discountVoice = useAnnouncer();
  // Opened from a design's page: the bill starts as that design — its cloths
  // and its stitching — and is printed as soon as it is created.
  const designId = route.params?.designId;
  const fromDesign = designId !== undefined && !editing;
  const [form, setForm] = useState<BillForm>(EMPTY_BILL_FORM);
  // What the form started as; leaving with anything different asks first. A
  // new bill starts blank, an edited one starts as saved (null until loaded).
  const [baseline, setBaseline] = useState<BillForm | null>(
    editing ? null : EMPTY_BILL_FORM
  );
  // What has been paid on the bill being edited. Payments aren't edited
  // here, so the bill may not be changed to come to less than this.
  const [paidPaise, setPaidPaise] = useState(0);
  const [finished, setFinished] = useState(false);
  // Errors stay hidden until the first Create, so the form doesn't scold the
  // tailor for parts they haven't reached yet.
  const [submitted, setSubmitted] = useState(false);
  const [pickingCloth, setPickingCloth] = useState(false);
  const [scanningCloth, setScanningCloth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdBillId, setCreatedBillId] = useState<number | null>(null);
  const [garmentRates, setGarmentRates] = useState<GarmentRate[]>([]);
  // The cloth line to open on its first box, set when cloths are added.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const mobileInput = useRef<TextInput>(null);
  const lastKey = useRef(0);
  const nextKey = (): string => String(++lastKey.current);

  const dirty = baseline !== null && form !== baseline;

  usePreventRemove(dirty && !finished && createdBillId === null, ({ data }) => {
    Alert.alert(
      editing ? t('Discard changes?') : t('Discard this bill?'),
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

  // Opening a bill to change it: lay it back out as the form that made it.
  // If it can't be read there is nothing to edit, so go back.
  useEffect(() => {
    if (billId === undefined) return;
    let active = true;
    Promise.all([
      billRepo.get(billId),
      clothRepo.list(),
      garmentRateRepo.list(),
    ])
      .then(([bill, cloths, rates]) => {
        if (!active) return;
        if (!bill) throw new Error('Bill not found');
        const loaded = formFromBill(
          bill,
          rates.map((rate) => rate.name),
          new Map(cloths.map((cloth) => [cloth.id, cloth.imageName])),
          nextKey
        );
        setForm(loaded);
        setBaseline(loaded);
        setPaidPaise(bill.paidPaise);
      })
      .catch(() => {
        if (!active) return;
        Alert.alert(
          t('Bill not found'),
          t('It could not be opened for editing.')
        );
        navigation.goBack();
      });
    return () => {
      active = false;
    };
    // nextKey only reads a ref, so it is stable.
  }, [billId, navigation]);

  useEffect(() => {
    if (finished) navigation.goBack();
  }, [finished, navigation]);

  // The garments offered for one-tap adding, at the Rate Master's charges.
  // If they can't be read, "Other" still lets any garment be added by hand.
  useEffect(() => {
    let active = true;
    garmentRateRepo.list().then(
      (rates) => {
        if (active) setGarmentRates(rates);
      },
      () => {}
    );
    return () => {
      active = false;
    };
  }, []);

  // The new bill takes this screen's place, so Back from it goes to the
  // list rather than into a form that has already been used.
  useEffect(() => {
    if (createdBillId === null) return;
    navigation.replace('BillDetail', { billId: createdBillId });
    // From a design the bill goes straight on to the printer, and Back from
    // there lands on the bill.
    if (fromDesign) {
      navigation.navigate('PrintBill', {
        billId: createdBillId,
        autoPrint: true,
      });
    }
  }, [createdBillId, navigation, fromDesign]);

  const update = (patch: Partial<BillForm>): void =>
    setForm((current) => ({ ...current, ...patch }));

  // Every cloth ticked in the picker becomes its own line, in tap order; a
  // cloth whose label was scanned becomes one line the same way.
  const addCloths = (picked: Cloth[], type: ClothType | null = null): void => {
    setPickingCloth(false);
    setScanningCloth(false);
    // Built here, not inside the state update, so each line's key is made once.
    const added: ClothEntry[] = picked.map((cloth) => ({
      key: nextKey(),
      clothId: cloth.id,
      clothName: cloth.name,
      clothNameHindi: cloth.nameHindi,
      imageName: cloth.imageName,
      // A label for one type brings that type, at its own rate.
      pricePerMeterPaise: type?.pricePerMeterPaise ?? cloth.pricePerMeterPaise,
      variant: type?.name ?? '',
      extra: '',
      meters: '',
    }));
    // The first new line opens on its first box, keyboard up, to be filled in
    // from the top.
    setFocusKey(added[0]?.key ?? null);
    animateNextLayout();
    setForm((current) => ({
      ...current,
      cloths: [...current.cloths, ...added],
    }));
  };

  // A bill started from a design opens with the design's cloths and stitching
  // on it, to be given a customer and created.
  useEffect(() => {
    if (!fromDesign) return;
    let active = true;
    patternRepo.getItem(designId).then(
      (design) => {
        if (!active) return;
        if (!design) {
          Alert.alert(t('Design not found'), t('It may have been deleted.'));
          navigation.goBack();
          return;
        }
        animateNextLayout();
        setForm((current) => ({
          ...current,
          ...billLinesFromDesign(design, nextKey),
        }));
      },
      () => {
        if (!active) return;
        Alert.alert(t('Design not opened'), t('Go back and try again.'));
        navigation.goBack();
      }
    );
    return () => {
      active = false;
    };
    // Only when the screen opens: later edits must not lay the design out again.
  }, []);

  // A garment already on the bill gets one more piece rather than a second
  // line of the same name. A new line starts at the Rate Master's charge,
  // which the tailor can still change for this bill.
  const addGarment = ({ name, makingPaise }: GarmentRate): void => {
    animateNextLayout();
    setForm((current) => {
      const existing = current.garments.find(
        (garment) => !garment.custom && garment.name === name
      );
      return {
        ...current,
        garments: existing
          ? current.garments.map((garment) =>
              garment === existing
                ? { ...garment, quantity: garment.quantity + 1 }
                : garment
            )
          : [
              ...current.garments,
              {
                key: nextKey(),
                name,
                custom: false,
                quantity: 1,
                making: paiseToInput(makingPaise),
              },
            ],
      };
    });
  };

  const addOtherGarment = (): void => {
    animateNextLayout();
    setForm((current) => ({
      ...current,
      garments: [
        ...current.garments,
        { key: nextKey(), name: '', custom: true, quantity: 1, making: '' },
      ],
    }));
  };

  const updateCloth = (key: string, patch: Partial<ClothEntry>): void =>
    setForm((current) => ({
      ...current,
      cloths: current.cloths.map((cloth) =>
        cloth.key === key ? { ...cloth, ...patch } : cloth
      ),
    }));

  const removeCloth = (key: string): void => {
    animateNextLayout();
    setForm((current) => ({
      ...current,
      cloths: current.cloths.filter((cloth) => cloth.key !== key),
    }));
  };

  const removeGarment = (key: string): void => {
    animateNextLayout();
    setForm((current) => ({
      ...current,
      garments: current.garments.filter((garment) => garment.key !== key),
    }));
  };

  const updateGarment = (key: string, patch: Partial<GarmentEntry>): void =>
    setForm((current) => ({
      ...current,
      garments: current.garments.map((garment) =>
        garment.key === key ? { ...garment, ...patch } : garment
      ),
    }));

  const validation = validateBillForm(
    form,
    editing ? { editingPaidPaise: paidPaise } : {}
  );
  const errors = submitted && !validation.ok ? validation.errors : NO_ERRORS;
  const dtValue = normalizeDtValue(form.dtNumber);
  const totals = draftTotals(form);
  const lines = draftLines(form);
  const paidNowPaise = parseRupees(form.paidNow) ?? 0;
  const balancePaise = Math.max(totals.totalPaise - paidNowPaise, 0);

  // What the total in the footer is made of, so it can be trusted without
  // scrolling down to the summary: "Total · 2 cloths, 3 pieces".
  const pieces = form.garments.reduce((sum, g) => sum + g.quantity, 0);
  const counts = [
    form.cloths.length
      ? form.cloths.length === 1
        ? t('1 cloth')
        : t('{0} cloths', form.cloths.length)
      : null,
    pieces ? (pieces === 1 ? t('1 piece') : t('{0} pieces', pieces)) : null,
  ].filter(Boolean);
  const footerNote = counts.length
    ? t('Total · {0}', counts.join(', '))
    : t('Total');

  const handleSave = async (): Promise<void> => {
    setSubmitted(true);
    if (!validation.ok) {
      haptics.error();
      return;
    }
    Keyboard.dismiss();
    setSaving(true);
    try {
      if (billId === undefined) {
        const newId = await billRepo.create(validation.bill);
        haptics.success();
        setCreatedBillId(newId);
      } else {
        await billRepo.update(billId, validation.bill);
        haptics.success();
        setFinished(true);
      }
    } catch (error) {
      haptics.error();
      if (error instanceof BillBelowPaymentsError) {
        Alert.alert(
          t('Bill is less than what was paid'),
          t(
            '{0} has already been paid on this bill, so it cannot come to less.',
            formatRupees(error.paidPaise)
          )
        );
      } else {
        Alert.alert(
          editing ? t('Changes not saved') : t('Bill not created'),
          t('The bill could not be saved. Try again.')
        );
      }
    } finally {
      setSaving(false);
    }
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
                <Section
                  title={t(LABEL.customer)}
                  step={1}
                  description={t('Who the bill is for')}
                >
                  <TextField
                    label={t('Name (optional)')}
                    placeholder={t('Customer name')}
                    value={form.customerName}
                    onChangeText={(customerName) => update({ customerName })}
                    clearable
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => mobileInput.current?.focus()}
                    autoCapitalize="words"
                    maxLength={60}
                  />
                  <TextField
                    label={t('Mobile (optional)')}
                    placeholder={t('10-digit number')}
                    prefix="+91 "
                    value={form.customerMobile}
                    ref={mobileInput}
                    onChangeText={(customerMobile) =>
                      update({ customerMobile })
                    }
                    clearable
                    error={errors.customerMobile}
                    digits={10}
                  />
                  <TextField
                    label={t('DT number (optional)')}
                    placeholder={t('e.g. 1 or A-1')}
                    prefix="DT "
                    hint={
                      dtValue
                        ? t('Prints as {0}', formatDt(dtValue))
                        : t(
                            'Your own number for this bill, printed on it as you write it'
                          )
                    }
                    value={form.dtNumber}
                    onChangeText={(text) =>
                      update({ dtNumber: sanitizeDtInput(text) })
                    }
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={DT_VALUE_MAX_LENGTH}
                    clearable
                  />
                </Section>

                {errors.items ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={styles.itemsError}
                  >
                    {errors.items}
                  </Text>
                ) : null}

                <Section
                  title={t(LABEL.cloth)}
                  step={2}
                  description={t('From your catalog, by the meter')}
                  aside={
                    totals.clothPaise ? (
                      <Text style={styles.sectionTotal}>
                        {formatRupees(totals.clothPaise)}
                      </Text>
                    ) : null
                  }
                >
                  {form.cloths.map((entry, index) => (
                    <React.Fragment key={entry.key}>
                      {index > 0 ? <View style={styles.lineDivider} /> : null}
                      <ClothLineEditor
                        autoFocus={entry.key === focusKey}
                        entry={entry}
                        errors={errors.cloths[entry.key]}
                        onChange={(patch) => updateCloth(entry.key, patch)}
                        onRemove={() => removeCloth(entry.key)}
                      />
                    </React.Fragment>
                  ))}
                  {form.cloths.length === 0 ? (
                    <View style={styles.empty}>
                      <Ionicons
                        name="layers-outline"
                        size={22}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.emptyTitle}>
                        {t('No cloth added yet')}
                      </Text>
                      <Text style={styles.emptyHint}>
                        {t(
                          'Pick cloths from your catalog, or scan the QR label on a roll.'
                        )}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.addRow}>
                    <Button
                      label={
                        form.cloths.length
                          ? t('Add another cloth')
                          : t('Select cloth')
                      }
                      icon="add"
                      variant="tonal"
                      onPress={() => setPickingCloth(true)}
                      style={styles.addButton}
                    />
                    <Button
                      label={t('Scan QR')}
                      icon="qr-code-outline"
                      variant="secondary"
                      onPress={() => setScanningCloth(true)}
                    />
                  </View>
                </Section>

                <Section
                  title={t(LABEL.stitching)}
                  step={3}
                  description={t('Tap a garment to add it')}
                  aside={
                    totals.makingPaise ? (
                      <Text style={styles.sectionTotal}>
                        {formatRupees(totals.makingPaise)}
                      </Text>
                    ) : null
                  }
                >
                  {form.garments.map((entry, index) => (
                    <React.Fragment key={entry.key}>
                      {index > 0 ? <View style={styles.lineDivider} /> : null}
                      <GarmentLineEditor
                        entry={entry}
                        errors={errors.garments[entry.key]}
                        onChange={(patch) => updateGarment(entry.key, patch)}
                        onRemove={() => removeGarment(entry.key)}
                      />
                    </React.Fragment>
                  ))}
                  <View style={styles.chips}>
                    {garmentRates.map((rate) => (
                      <Chip
                        key={rate.id}
                        label={rate.name}
                        leading={<GarmentImage name={rate.name} size={28} />}
                        onPress={() => addGarment(rate)}
                      />
                    ))}
                    <Chip
                      label={t('Other')}
                      icon="create-outline"
                      onPress={addOtherGarment}
                    />
                  </View>
                </Section>
              </>
            }
            second={
              <>
                <Section
                  title={
                    editing ? t(LABEL.discount) : t(LABEL.discountAndPayment)
                  }
                  step={4}
                >
                  <SegmentedControl
                    options={discountModes()}
                    value={form.discountMode}
                    onChange={(discountMode: DiscountMode) => {
                      update({ discountMode, discount: '' });
                      discountVoice.say(null);
                    }}
                  />
                  <TextField
                    label={t('Discount (optional)')}
                    placeholder="0"
                    prefix={form.discountMode === 'amount' ? '₹ ' : undefined}
                    suffix={form.discountMode === 'percent' ? '%' : undefined}
                    value={form.discount}
                    onChangeText={(discount) => {
                      update({ discount });
                      // "10 percent discount", said once the figure settles.
                      discountVoice.say(
                        spokenDiscount(
                          readDiscount(form.discountMode, discount)
                        )
                      );
                    }}
                    error={errors.discount}
                    decimal={
                      form.discountMode === 'percent'
                        ? PERCENT_LIMITS
                        : RUPEE_LIMITS
                    }
                  />
                  {editing ? null : (
                    <TextField
                      label={t('Paid now (optional)')}
                      placeholder="0"
                      prefix="₹ "
                      hint={t('Advance taken from the customer today')}
                      value={form.paidNow}
                      onChangeText={(paidNow) => update({ paidNow })}
                      error={errors.paidNow}
                      decimal={RUPEE_LIMITS}
                    />
                  )}
                </Section>

                <Section
                  title={t(LABEL.summary)}
                  description={t('Check the bill before you save it')}
                >
                  {/* The whole bill from A to Z, as an invoice lists it: every
                cloth with its meters, rate and amount, every stitching line,
                then what it adds up to — checked once here before it is
                made. */}
                  {lines.cloths.length ? (
                    <View style={styles.group}>
                      <View style={styles.groupHeader}>
                        <Text style={styles.groupTitle}>{t(LABEL.cloth)}</Text>
                        <Text style={styles.groupAside}>
                          {t(
                            '{0} in all',
                            formatMeters(totalLengthCm(lines.cloths))
                          )}
                        </Text>
                      </View>
                      {lines.cloths.map((cloth, index) => (
                        <React.Fragment key={cloth.key}>
                          {index > 0 ? (
                            <View style={styles.lineDivider} />
                          ) : null}
                          <LineRow
                            title={clothLineName(cloth)}
                            subtitle={clothLineHindi(
                              cloth.clothName,
                              cloth.clothNameHindi,
                              cloth.variant
                            )}
                            detail={t(
                              '{0} × {1} / m',
                              formatMeters(cloth.lengthCm),
                              formatRupees(cloth.pricePerMeterPaise)
                            )}
                            paise={cloth.amountPaise}
                          />
                        </React.Fragment>
                      ))}
                    </View>
                  ) : null}
                  {lines.garments.length ? (
                    <View style={styles.group}>
                      <Text style={styles.groupTitle}>
                        {t(LABEL.stitching)}
                      </Text>
                      {lines.garments.map((garment, index) => (
                        <React.Fragment key={garment.key}>
                          {index > 0 ? (
                            <View style={styles.lineDivider} />
                          ) : null}
                          <LineRow
                            title={garment.name || t('Other')}
                            detail={`${garment.quantity} × ${formatRupees(garment.makingPaise)}`}
                            paise={garment.amountPaise}
                          />
                        </React.Fragment>
                      ))}
                    </View>
                  ) : null}
                  {lines.cloths.length || lines.garments.length ? (
                    <View style={styles.lineDivider} />
                  ) : null}
                  <View style={styles.summary}>
                    <AmountRow
                      label={t(LABEL.cloth)}
                      paise={totals.clothPaise}
                    />
                    <AmountRow
                      label={t(LABEL.making)}
                      paise={totals.makingPaise}
                    />
                    {totals.discountPaise ? (
                      <AmountRow
                        label={t(LABEL.discount)}
                        paise={totals.discountPaise}
                        negative
                      />
                    ) : null}
                    <AmountRow
                      label={t(LABEL.total)}
                      paise={totals.totalPaise}
                      emphasis
                    />
                    {editing && paidPaise ? (
                      <>
                        <AmountRow
                          label={t(LABEL.alreadyPaid)}
                          paise={paidPaise}
                        />
                        <AmountRow
                          label={t(LABEL.balanceDue)}
                          paise={Math.max(totals.totalPaise - paidPaise, 0)}
                        />
                      </>
                    ) : null}
                    {!editing && paidNowPaise ? (
                      <>
                        <AmountRow
                          label={t(LABEL.paidNow)}
                          paise={paidNowPaise}
                        />
                        <AmountRow
                          label={t(LABEL.balanceDue)}
                          paise={balancePaise}
                        />
                      </>
                    ) : null}
                  </View>
                  {errors.total ? (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={styles.itemsError}
                    >
                      {errors.total}
                    </Text>
                  ) : null}
                </Section>
              </>
            }
          />
        </PageColumn>
      </KeyboardAwareScroll>

      <Footer maxWidth={pageMaxWidth}>
        <View style={styles.footerRow}>
          <View style={styles.footerTotal}>
            <Text numberOfLines={1} style={styles.footerLabel}>
              {footerNote}
            </Text>
            <Text numberOfLines={1} style={styles.footerAmount}>
              {formatRupees(totals.totalPaise)}
            </Text>
          </View>
          <Button
            label={
              editing
                ? t('Save changes')
                : fromDesign
                  ? t('Create & print')
                  : t('Create bill')
            }
            icon={fromDesign ? 'print-outline' : 'checkmark'}
            onPress={handleSave}
            loading={saving}
            style={styles.createButton}
          />
        </View>
      </Footer>

      <ClothScanner
        visible={scanningCloth}
        onClose={() => setScanningCloth(false)}
        onScanned={(cloth, type) => addCloths([cloth], type)}
      />

      <ClothPicker
        visible={pickingCloth}
        onClose={() => setPickingCloth(false)}
        onConfirm={(picked) => addCloths(picked)}
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
  itemsError: {
    ...TYPE.bodyStrong,
    color: COLORS.danger,
    textAlign: 'center',
  },
  sectionTotal: { ...TYPE.price, color: COLORS.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addRow: { flexDirection: 'row', gap: 10 },
  empty: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.background,
  },
  emptyTitle: { ...TYPE.bodyStrong, color: COLORS.textPrimary, marginTop: 4 },
  emptyHint: {
    ...TYPE.caption,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  addButton: { flex: 1 },
  summary: { gap: 10 },
  lineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  group: { gap: 12 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupTitle: { ...TYPE.section, color: COLORS.textSecondary },
  groupAside: { ...TYPE.label, color: COLORS.accent },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  footerTotal: { flex: 1 },
  footerLabel: { ...TYPE.caption, color: COLORS.textSecondary },
  footerAmount: {
    ...TYPE.title,
    fontVariant: ['tabular-nums'],
    color: COLORS.textPrimary,
  },
  createButton: { minWidth: 160 },
}));
