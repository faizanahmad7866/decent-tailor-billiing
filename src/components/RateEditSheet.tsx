import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GARMENT_HINDI_NAMES, garmentKey } from '../constants/garments';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import {
  garmentRateRepo,
  type GarmentRate,
} from '../repositories/garmentRateRepo';
import { haptics } from '../utils/haptics';
import { RUPEE_LIMITS } from '../utils/inputFilters';
import { formatRupees, paiseToInput, parseRupees } from '../utils/money';
import { Button } from './Button';
import { GarmentImage } from './GarmentImage';
import { Tap } from './Tap';
import { TextField } from './TextField';

// When rates move, a shop moves them in round steps. These make the common
// change a tap or two, with no typing on a phone keypad.
const QUICK_ADJUSTMENTS_RUPEES = [-100, -50, 50, 100];

interface RateEditSheetProps {
  /** The garment being edited; null keeps the sheet closed. */
  rate: GarmentRate | null;
  onClose: () => void;
  onSaved: () => void;
}

/** A bottom sheet to change one garment's making charge. */
export const RateEditSheet: React.FC<RateEditSheetProps> = ({
  rate,
  onClose,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!rate) return;
    setText(paiseToInput(rate.makingPaise));
    setError(undefined);
  }, [rate]);

  const adjust = (rupees: number): void => {
    const current = parseRupees(text) ?? 0;
    setText(paiseToInput(Math.max(current + rupees * 100, 0)));
    setError(undefined);
  };

  const handleSave = async (): Promise<void> => {
    if (!rate) return;
    const paise = parseRupees(text);
    if (paise === null) {
      haptics.error();
      setError(t('Enter a rate like 500'));
      return;
    }
    if (paise === rate.makingPaise) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await garmentRateRepo.updateRate(rate.id, paise);
      haptics.success();
      onSaved();
    } catch {
      haptics.error();
      setError(t('The rate could not be saved. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  const hindi = rate ? GARMENT_HINDI_NAMES[garmentKey(rate.name)] : undefined;

  return (
    <Modal
      visible={rate !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* A Modal is its own window and doesn't share the screen's keyboard
          handling; without this the keyboard covers the field and Save. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('Close')}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />

          {rate ? (
            <View style={styles.header}>
              <GarmentImage name={rate.name} size={52} />
              <View style={styles.headerText}>
                <Text style={styles.title}>
                  {rate.name}
                  {hindi ? (
                    <Text style={styles.hindi}>{`  ${hindi}`}</Text>
                  ) : null}
                </Text>
                <Text style={styles.current}>
                  {t('Now {0} per piece', formatRupees(rate.makingPaise))}
                </Text>
              </View>
            </View>
          ) : null}

          <TextField
            label={t('Making charge per piece')}
            prefix="₹ "
            value={text}
            onChangeText={(value) => {
              setText(value);
              setError(undefined);
            }}
            error={error}
            decimal={RUPEE_LIMITS}
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View style={styles.quick}>
            {QUICK_ADJUSTMENTS_RUPEES.map((rupees) => (
              <Tap
                key={rupees}
                onPress={() => adjust(rupees)}
                haptic="select"
                throttle={false}
                accessibilityLabel={
                  rupees > 0
                    ? t('Add {0} rupees', rupees)
                    : t('Take off {0} rupees', Math.abs(rupees))
                }
                style={styles.quickButton}
              >
                <Text style={styles.quickLabel}>
                  {rupees > 0 ? `+${rupees}` : `−${Math.abs(rupees)}`}
                </Text>
              </Tap>
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              label={t('Cancel')}
              variant="secondary"
              onPress={onClose}
              style={styles.action}
            />
            <Button
              label={t('Save rate')}
              icon="checkmark"
              onPress={handleSave}
              loading={saving}
              style={styles.action}
            />
          </View>
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
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 18,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerText: { flex: 1, gap: 2 },
  title: { ...TYPE.heading, color: COLORS.textPrimary },
  hindi: { ...TYPE.body, color: COLORS.textSecondary },
  current: { ...TYPE.caption, color: COLORS.textSecondary },
  quick: { flexDirection: 'row', gap: 8 },
  quickButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.primaryTint,
  },
  quickLabel: {
    ...TYPE.bodyStrong,
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
}));
