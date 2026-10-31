import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { garmentLineAmount } from '../../utils/billMath';
import type { GarmentEntry } from '../../utils/billForm';
import { RUPEE_LIMITS } from '../../utils/inputFilters';
import { formatRupees, parseRupees } from '../../utils/money';
import { GarmentImage } from '../GarmentImage';
import { IconButton } from '../IconButton';
import { Stepper } from '../Stepper';
import { TextField } from '../TextField';

interface GarmentLineEditorProps {
  entry: GarmentEntry;
  errors?: { name?: string; making?: string };
  onChange: (patch: Partial<GarmentEntry>) => void;
  onRemove: () => void;
}

/** One garment to stitch: how many, the making charge each, and the total. */
export const GarmentLineEditor: React.FC<GarmentLineEditorProps> = ({
  entry,
  errors,
  onChange,
  onRemove,
}) => {
  const makingInput = useRef<TextInput>(null);
  const makingPaise = parseRupees(entry.making);
  const amount = garmentLineAmount({
    quantity: entry.quantity,
    makingPaise: makingPaise ?? 0,
  });
  const label = entry.name.trim() || t('Garment');

  return (
    <View style={styles.line}>
      <View style={styles.top}>
        {entry.custom ? (
          <View style={styles.nameField}>
            <TextField
              label={t('Garment name')}
              placeholder={t('e.g. Sherwani')}
              value={entry.name}
              onChangeText={(name) => onChange({ name })}
              error={errors?.name}
              autoCapitalize="words"
              maxLength={30}
              clearable
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => makingInput.current?.focus()}
            />
          </View>
        ) : (
          <>
            <View style={styles.picture}>
              <GarmentImage name={entry.name} size={40} />
            </View>
            <Text numberOfLines={1} style={styles.name}>
              {entry.name}
            </Text>
          </>
        )}
        <Text style={[styles.amount, makingPaise === null && styles.empty]}>
          {formatRupees(amount)}
        </Text>
        <IconButton
          icon="close"
          label={t('Remove {0}', label)}
          color={COLORS.textSecondary}
          onPress={onRemove}
        />
      </View>

      <View style={styles.inputs}>
        <View>
          <Text style={styles.inputLabel}>{t('Qty')}</Text>
          <Stepper
            value={entry.quantity}
            onChange={(quantity) => onChange({ quantity })}
            label={t('{0} quantity', label)}
          />
        </View>
        <View style={styles.making}>
          <TextField
            ref={makingInput}
            label={t('Making / piece')}
            placeholder="0"
            prefix="₹ "
            value={entry.making}
            onChangeText={(making) => onChange({ making })}
            error={errors?.making}
            decimal={RUPEE_LIMITS}
          />
        </View>
      </View>
    </View>
  );
};

const styles = themedStyles(() => ({
  line: { gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameField: { flex: 1 },
  picture: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  name: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    flex: 1,
    color: COLORS.textPrimary,
  },
  amount: { ...TYPE.price, color: COLORS.textPrimary },
  empty: { color: COLORS.textMuted },
  inputs: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  // Matches TextField's own label, so the two boxes line up.
  inputLabel: { ...TYPE.label, color: COLORS.textPrimary, marginBottom: 6 },
  making: { flex: 1 },
}));
