import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { OfferPreview } from '../components/pattern/OfferPreview';
import { OfferSheet } from '../components/pattern/OfferSheet';
import { useShowroomFonts } from '../components/showroom/useShowroomFonts';
import { EmptyState } from '../components/EmptyState';
import { Footer } from '../components/Footer';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import { Section } from '../components/Section';
import { Tap } from '../components/Tap';
import { TextField } from '../components/TextField';
import { IconButton } from '../components/IconButton';
import { COLORS, OFFER, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { shownDate } from '../i18n/dates';
import { shownCategory } from '../i18n/names';
import { t } from '../i18n/t';
import { usePagePadding } from '../layout/Page';
import { FORM_MAX_WIDTH } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import { patternRepo } from '../repositories/patternRepo';
import { loadOffers, saveOffers } from '../storage/offerStore';
import { loadShowroomPin, saveShowroomPin } from '../storage/showroomPinStore';
import { haptics } from '../utils/haptics';
import { daysLeft, MAX_OFFERS, type Offer } from '../utils/offers';
import {
  isFullPin,
  PIN_LENGTH,
  showroomCategories,
  type ShowroomCategory,
} from '../utils/showroom';

const CheckRow: React.FC<{
  label: string;
  count: number;
  checked: boolean;
  onPress: () => void;
}> = ({ label, count, checked, onPress }) => (
  <Tap
    onPress={onPress}
    haptic="select"
    throttle={false}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={`${label}, ${count}`}
    style={styles.check}
  >
    <View style={[styles.box, checked && styles.boxChecked]}>
      {checked ? (
        <Ionicons name="checkmark" size={18} color={COLORS.onPrimary} />
      ) : null}
    </View>
    <Text style={styles.checkLabel}>{label}</Text>
    <Text style={styles.checkCount}>{count}</Text>
  </Tap>
);

/** A setting for this showroom: what it does, a line on what it means, a switch. */
const SwitchRow: React.FC<{
  title: string;
  note: string;
  value: boolean;
  onChange: (on: boolean) => void;
}> = ({ title, note, value, onChange }) => (
  <View style={styles.switchRow}>
    <View style={styles.switchText}>
      <Text style={styles.switchTitle}>{title}</Text>
      <Text style={styles.switchNote}>{note}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: COLORS.borderStrong, true: COLORS.primary }}
      thumbColor="#FFFFFF"
      accessibilityLabel={title}
    />
  </View>
);

const OfferRow: React.FC<{
  offer: Offer;
  onEdit: () => void;
  onPreview: () => void;
  onToggle: (on: boolean) => void;
}> = ({ offer, onEdit, onPreview, onToggle }) => {
  const days = daysLeft(offer.endsAt);
  return (
    <View style={styles.offer}>
      <Tap
        onPress={onEdit}
        accessibilityLabel={t('Edit {0}', offer.title)}
        style={styles.offerMain}
      >
        <View style={styles.offerIcon}>
          <Ionicons name={offer.icon} size={20} color={OFFER.gold} />
        </View>
        <View style={styles.offerText}>
          <Text numberOfLines={1} style={styles.offerTitle}>
            {offer.title}
          </Text>
          <Text style={[styles.offerNote, days < 0 && styles.offerEnded]}>
            {days < 0 ? t('Ended') : t('Till {0}', shownDate(offer.endsAt))}
          </Text>
        </View>
      </Tap>
      <IconButton
        icon="eye-outline"
        label={t('See it as a customer will')}
        color={COLORS.accent}
        onPress={onPreview}
      />
      <Switch
        value={offer.on}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.borderStrong, true: COLORS.primary }}
        thumbColor="#FFFFFF"
        accessibilityLabel={offer.title}
      />
    </View>
  );
};

/**
 * Before the showroom opens: what to show, whether to show prices, whether to greet
 * the customer aloud, the offers to run among the designs, and the PIN that leaves
 * it. Every category starts ticked and prices and the voice start off, each time,
 * since what suits one customer may not suit the next. Only designs with a photo
 * count: a slide with no picture has nothing to show.
 */
export const ShowroomSetupScreen: React.FC<
  RootScreenProps<'ShowroomSetup'>
> = ({ navigation }) => {
  const pagePadding = usePagePadding({ footer: true });
  // The showroom's faces load while the tailor sets it up, ready for the preview
  // of an offer and for the showroom itself.
  useShowroomFonts();
  const [categories, setCategories] = useState<ShowroomCategory[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [chosen, setChosen] = useState<number[]>([]);
  const [showPrice, setShowPrice] = useState(false);
  const [voice, setVoice] = useState(false);
  const [pin, setPin] = useState(loadShowroomPin);
  const [submitted, setSubmitted] = useState(false);
  const [offers, setOffers] = useState<Offer[]>(loadOffers);
  // The offer sheet: null closed, no offer for a new one.
  const [editingOffer, setEditingOffer] = useState<{ offer?: Offer } | null>(
    null
  );
  const [previewing, setPreviewing] = useState<Offer | null>(null);

  useEffect(() => {
    let active = true;
    patternRepo.listShowroomDesigns().then(
      (designs) => {
        if (!active) return;
        const found = showroomCategories(designs);
        setCategories(found);
        setChosen(found.map((category) => category.id));
      },
      () => {
        if (active) setLoadFailed(true);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const total = useMemo(
    () =>
      (categories ?? [])
        .filter((category) => chosen.includes(category.id))
        .reduce((sum, category) => sum + category.count, 0),
    [categories, chosen]
  );

  if (loadFailed) {
    return (
      <View style={styles.page}>
        <EmptyState
          icon="cloud-offline-outline"
          title={t("Couldn't open the catalogue")}
          message={t('Go back and try again.')}
        />
      </View>
    );
  }

  if (!categories) {
    return (
      <View style={styles.page}>
        <ActivityIndicator color={COLORS.accent} style={styles.loading} />
      </View>
    );
  }

  if (!categories.length) {
    return (
      <View style={styles.page}>
        <EmptyState
          icon="images-outline"
          title={t('No designs with photos yet')}
          message={t(
            'Add a design with a photo, and it shows in the showroom.'
          )}
        />
      </View>
    );
  }

  const allChosen = chosen.length === categories.length;

  const keepOffers = (next: Offer[]): void => {
    setOffers(next);
    try {
      saveOffers(next);
    } catch {
      haptics.error();
      Alert.alert(
        t('Not saved'),
        t('The offer could not be saved. Try again.')
      );
    }
  };

  const saveOffer = (offer: Offer): void => {
    keepOffers(
      offers.some((other) => other.id === offer.id)
        ? offers.map((other) => (other.id === offer.id ? offer : other))
        : [...offers, offer]
    );
    setEditingOffer(null);
  };

  const toggle = (id: number): void =>
    setChosen((now) =>
      now.includes(id) ? now.filter((other) => other !== id) : [...now, id]
    );

  const start = (): void => {
    setSubmitted(true);
    if (!isFullPin(pin)) {
      haptics.error();
      return;
    }
    try {
      saveShowroomPin(pin);
    } catch {
      // Not remembered: it still works for this showroom, and is asked for again.
    }
    navigation.navigate('Showroom', {
      categoryIds: chosen,
      showPrice,
      voice,
      pin,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.page}
    >
      <KeyboardAwareScroll
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={pagePadding}
      >
        <View style={styles.column}>
          <Section
            title={t('What to show')}
            description={t('Only designs with a photo are shown')}
          >
            <CheckRow
              label={t('All designs')}
              count={categories.reduce((sum, c) => sum + c.count, 0)}
              checked={allChosen}
              onPress={() =>
                setChosen(allChosen ? [] : categories.map((c) => c.id))
              }
            />
            <View style={styles.divider} />
            {categories.map((category) => (
              <CheckRow
                key={category.id}
                label={shownCategory(category.name)}
                count={category.count}
                checked={chosen.includes(category.id)}
                onPress={() => toggle(category.id)}
              />
            ))}
          </Section>

          <Section title={t('Price')}>
            <SwitchRow
              title={t('Show the price')}
              note={t(
                'Off: the customer sees the designs, and you tell the price'
              )}
              value={showPrice}
              onChange={setShowPrice}
            />
          </Section>

          <Section title={t('Voice')}>
            <SwitchRow
              title={t('Welcome the customer')}
              note={t(
                'Welcomes the customer every 2 minutes, and reads out each offer as it shows'
              )}
              value={voice}
              onChange={setVoice}
            />
          </Section>

          <Section
            title={t('Offers')}
            aside={
              <Text style={styles.checkCount}>
                {offers.length} / {MAX_OFFERS}
              </Text>
            }
            description={t(
              'One shows after every 4 designs, and stops by itself after its last day'
            )}
          >
            {offers.map((offer) => (
              <OfferRow
                key={offer.id}
                offer={offer}
                onEdit={() => setEditingOffer({ offer })}
                onPreview={() => setPreviewing(offer)}
                onToggle={(on) =>
                  keepOffers(
                    offers.map((other) =>
                      other.id === offer.id ? { ...other, on } : other
                    )
                  )
                }
              />
            ))}
            {offers.length < MAX_OFFERS ? (
              <Button
                label={t('Add offer')}
                icon="add"
                variant="secondary"
                onPress={() => setEditingOffer({})}
              />
            ) : null}
          </Section>

          <Section title={t('Leaving the showroom')}>
            <TextField
              label={t('{0}-digit PIN', PIN_LENGTH)}
              value={pin}
              onChangeText={setPin}
              digits={PIN_LENGTH}
              secureTextEntry
              error={
                submitted && !isFullPin(pin)
                  ? t('Enter a {0}-digit PIN', PIN_LENGTH)
                  : undefined
              }
              hint={t('To leave, press the back button, then enter this PIN')}
            />
          </Section>
        </View>
      </KeyboardAwareScroll>

      <Footer maxWidth={FORM_MAX_WIDTH}>
        <Button
          label={t('Start showroom · {0} designs', total)}
          icon="play"
          disabled={total === 0}
          onPress={start}
        />
      </Footer>

      <OfferSheet
        visible={editingOffer !== null}
        editing={editingOffer?.offer ?? null}
        onSave={saveOffer}
        onDelete={() => {
          keepOffers(
            offers.filter((other) => other.id !== editingOffer?.offer?.id)
          );
          setEditingOffer(null);
        }}
        onClose={() => setEditingOffer(null)}
      />
      <OfferPreview offer={previewing} onClose={() => setPreviewing(null)} />
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
    gap: 16,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkLabel: { ...TYPE.body, flex: 1, color: COLORS.textPrimary },
  checkCount: { ...TYPE.label, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border },
  offer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  // The poster's own colours, so the row already looks like what it makes.
  offerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: OFFER.ground,
  },
  offerText: { flex: 1, minWidth: 0, gap: 2 },
  offerTitle: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  offerNote: { ...TYPE.caption, color: COLORS.textSecondary },
  offerEnded: { color: COLORS.danger },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchText: { flex: 1, gap: 2 },
  switchTitle: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  switchNote: { ...TYPE.caption, color: COLORS.textSecondary },
}));
