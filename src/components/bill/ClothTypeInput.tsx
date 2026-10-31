import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { billRepo } from '../../repositories/billRepo';
import { clothRepo } from '../../repositories/clothRepo';
import {
  clothTypeRepo,
  type ClothType,
} from '../../repositories/clothTypeRepo';
import { clothHindi } from '../../utils/clothHindi';
import { matchType, rateAfterTypeChange } from '../../utils/clothTypes';
import { formatRupees } from '../../utils/money';
import { Chip } from '../Chip';
import { ClothThumb } from '../ClothThumb';
import { Tap } from '../Tap';
import { TextField } from '../TextField';

interface ClothTypeInputProps {
  ref?: React.Ref<TextInput>;
  /** The cloth the type is for; its types are offered to choose from. */
  clothId: number | null;
  clothName: string;
  value: string;
  /** `ratePaise` when the type changes the rate the line is charged at. */
  onChange: (variant: string, ratePaise?: number) => void;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
}

/**
 * The cloth type of a line — "Royal Blue" on an Armani. The types defined on
 * the cloth drop down under the box with their photo and rate, and choosing one
 * takes its rate; anything else can still be typed by hand, as a note, at the
 * cloth's own rate. The types used for this cloth before are one tap away, and
 * its Hindi shows under the box as it is typed.
 */
export const ClothTypeInput: React.FC<ClothTypeInputProps> = ({
  ref,
  clothId,
  clothName,
  value,
  onChange,
  returnKeyType = 'done',
  onSubmitEditing,
}) => {
  const [types, setTypes] = useState<ClothType[]>([]);
  const [clothPrice, setClothPrice] = useState(0);
  const [pastTypes, setPastTypes] = useState<string[]>([]);
  const [open, setOpen] = useState(!value.trim());

  // What the cloth offers. Only a convenience: if it can't be read, the field
  // still works as a plain box. A line from before bills remembered their
  // cloth has nothing to offer.
  useEffect(() => {
    if (clothId === null) return;
    let active = true;
    Promise.all([
      clothTypeRepo.list(clothId),
      clothRepo.get(clothId),
      billRepo.recentVariants(clothId),
    ]).then(
      ([defined, cloth, past]) => {
        if (!active) return;
        setTypes(defined);
        setClothPrice(cloth?.pricePerMeterPaise ?? 0);
        setPastTypes(past);
      },
      () => {}
    );
    return () => {
      active = false;
    };
  }, [clothId]);

  const change = (next: string): void => {
    onChange(next, rateAfterTypeChange(types, clothPrice, value, next));
  };

  const choose = (type: ClothType): void => {
    change(type.name);
    setOpen(false);
  };

  const typed = value.trim().toLowerCase();
  const chosen = matchType(types, value);
  // Narrowed by what is typed; everything, once a type is chosen, to change it.
  const offered =
    typed && !chosen
      ? types.filter((type) => type.name.toLowerCase().includes(typed))
      : types;
  const suggestions = pastTypes.filter(
    (type) =>
      type.toLowerCase() !== typed &&
      !types.some(
        (defined) => defined.name.toLowerCase() === type.toLowerCase()
      )
  );
  const hindi = clothHindi(value.trim(), null);

  return (
    <View style={styles.field}>
      <TextField
        ref={ref}
        label={t('Cloth type · कपड़े का प्रकार (optional)')}
        placeholder={
          types.length
            ? t('Choose below, or type')
            : t('e.g. {0} Royal Blue', clothName)
        }
        hint={hindi ? t('हिंदी: {0}', hindi) : undefined}
        value={value}
        onChangeText={(text) => {
          change(text);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoCapitalize="words"
        maxLength={40}
        clearable
        returnKeyType={returnKeyType}
        submitBehavior="submit"
        onSubmitEditing={onSubmitEditing}
        endAdornment={
          types.length ? (
            <Tap
              onPress={() => setOpen((now) => !now)}
              haptic="select"
              throttle={false}
              accessibilityLabel={
                open ? t('Hide the cloth types') : t('Show the cloth types')
              }
              style={styles.toggle}
            >
              <Ionicons
                name={open ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.accent}
              />
            </Tap>
          ) : null
        }
      />
      {open && offered.length ? (
        <View style={styles.dropdown}>
          {offered.map((type, index) => {
            const selected = type.id === chosen?.id;
            return (
              <Tap
                key={type.id}
                onPress={() => choose(type)}
                haptic="select"
                throttle={false}
                accessibilityLabel={t(
                  '{0}, {1} per meter',
                  type.name,
                  formatRupees(type.pricePerMeterPaise)
                )}
                accessibilityState={{ selected }}
                style={[
                  styles.option,
                  index > 0 && styles.optionRule,
                  selected && styles.optionSelected,
                ]}
              >
                <ClothThumb
                  name={type.name}
                  imageName={type.imageName}
                  style={styles.thumb}
                />
                <View style={styles.optionNames}>
                  <Text numberOfLines={1} style={styles.optionName}>
                    {type.name}
                  </Text>
                  {clothHindi(type.name, null) ? (
                    <Text numberOfLines={1} style={styles.optionHindi}>
                      {clothHindi(type.name, null)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.optionRate}>
                  {t('{0} / m', formatRupees(type.pricePerMeterPaise))}
                </Text>
              </Tap>
            );
          })}
        </View>
      ) : null}
      {suggestions.length ? (
        <View style={styles.chips}>
          {suggestions.map((type) => (
            <Chip
              key={type}
              label={type}
              icon="time-outline"
              accessibilityLabel={t('Use cloth type {0}', type)}
              onPress={() => change(type)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = themedStyles(() => ({
  field: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  optionRule: { borderTopWidth: 1, borderTopColor: COLORS.border },
  optionSelected: { backgroundColor: COLORS.primaryTint },
  thumb: { width: 36, height: 36, borderRadius: RADIUS.sm },
  optionNames: { flex: 1, minWidth: 0 },
  optionName: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  optionHindi: { ...TYPE.caption, color: COLORS.textSecondary },
  optionRate: {
    ...TYPE.label,
    fontVariant: ['tabular-nums'],
    color: COLORS.textPrimary,
  },
}));
