import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { shownDate } from '../../i18n/dates';
import { t } from '../../i18n/t';
import { startOfDay } from '../../utils/dateRange';
import { haptics } from '../../utils/haptics';
import {
  daysLeft,
  OFFER_ICONS,
  OFFER_LINE_MAX_LENGTH,
  OFFER_TITLE_MAX_LENGTH,
  offerEndAfter,
  type Offer,
  type OfferIcon,
} from '../../utils/offers';
import { Button } from '../Button';
import { RangeCalendar } from '../RangeCalendar';
import { Tap } from '../Tap';
import { TextField } from '../TextField';
import { ValueChips } from '../ValueChips';

// How long most offers run, one tap each.
const QUICK_DAYS = [3, 7, 15, 30] as const;

interface OfferSheetProps {
  visible: boolean;
  /** The offer being changed; none for a new one. */
  editing: Offer | null;
  onSave: (offer: Offer) => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Writes one offer: what it says, its icon, and its last day. */
export const OfferSheet: React.FC<OfferSheetProps> = ({
  visible,
  editing,
  onSave,
  onDelete,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [occasion, setOccasion] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [icon, setIcon] = useState<OfferIcon>(OFFER_ICONS[0]);
  const [endsAt, setEndsAt] = useState(() => offerEndAfter(7));
  const [picking, setPicking] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setOccasion(editing?.occasion ?? '');
    setTitle(editing?.title ?? '');
    setNote(editing?.note ?? '');
    setIcon(editing?.icon ?? OFFER_ICONS[0]);
    setEndsAt(editing?.endsAt ?? offerEndAfter(7));
    setPicking(false);
    setSubmitted(false);
  }, [visible, editing]);

  const save = (): void => {
    setSubmitted(true);
    if (!title.trim()) {
      haptics.error();
      return;
    }
    onSave({
      id: editing?.id ?? Date.now(),
      occasion: occasion.trim(),
      title: title.trim(),
      note: note.trim(),
      icon,
      endsAt,
      on: editing?.on ?? true,
    });
  };

  const confirmDelete = (): void =>
    Alert.alert(t('Delete this offer?'), t('This cannot be undone.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Delete'), style: 'destructive', onPress: onDelete },
    ]);

  const today = startOfDay(new Date());
  const lastDay = new Date(endsAt);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
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
              {editing ? t('Edit offer') : t('Add offer')}
            </Text>

            <TextField
              label={t('The offer, set large')}
              placeholder={t('e.g. 10% off')}
              value={title}
              onChangeText={setTitle}
              maxLength={OFFER_TITLE_MAX_LENGTH}
              error={
                submitted && !title.trim() ? t('Write the offer') : undefined
              }
              hint={t('Short is stronger: a few words at most')}
            />
            <TextField
              label={t('Occasion (optional)')}
              placeholder={t('e.g. Eid offer')}
              value={occasion}
              onChangeText={setOccasion}
              maxLength={OFFER_LINE_MAX_LENGTH}
            />
            <TextField
              label={t('Small line (optional)')}
              placeholder={t('e.g. On all Jodhpuri suits')}
              value={note}
              onChangeText={setNote}
              maxLength={OFFER_LINE_MAX_LENGTH}
            />

            <View style={styles.group}>
              <Text style={styles.label}>{t('Icon')}</Text>
              <View style={styles.icons}>
                {OFFER_ICONS.map((name) => {
                  const selected = name === icon;
                  return (
                    <Tap
                      key={name}
                      onPress={() => setIcon(name)}
                      haptic="select"
                      throttle={false}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={name}
                      style={[styles.icon, selected && styles.iconSelected]}
                    >
                      <Ionicons
                        name={name}
                        size={22}
                        color={selected ? COLORS.onPrimary : COLORS.accent}
                      />
                    </Tap>
                  );
                })}
              </View>
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>{t('Last day')}</Text>
              <Text style={styles.lastDay}>{shownDate(endsAt)}</Text>
              <ValueChips
                describes={t('days')}
                options={QUICK_DAYS.map((days) => ({
                  key: String(days),
                  label: t('{0} days', days),
                  selected: daysLeft(endsAt) === days - 1,
                }))}
                onPick={(key) => setEndsAt(offerEndAfter(Number(key)))}
              />
              <Button
                label={t('Choose date')}
                icon="calendar-outline"
                variant="secondary"
                onPress={() => setPicking((open) => !open)}
              />
              {picking ? (
                <RangeCalendar
                  selection={{ start: lastDay, end: null }}
                  today={today}
                  ahead
                  onPick={(day) => {
                    setEndsAt(day.toISOString());
                    setPicking(false);
                  }}
                />
              ) : null}
            </View>

            <Button label={t('Save offer')} icon="checkmark" onPress={save} />
            {editing ? (
              <Button
                label={t('Delete offer')}
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
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8, gap: 14 },
  title: { ...TYPE.title, color: COLORS.textPrimary },
  group: { gap: 8 },
  label: { ...TYPE.label, color: COLORS.textPrimary },
  lastDay: { ...TYPE.heading, color: COLORS.textPrimary },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  iconSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
}));
