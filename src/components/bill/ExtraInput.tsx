import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { COLORS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { RUPEE_LIMITS } from '../../utils/inputFilters';
import { formatRupees, parseSignedRupees } from '../../utils/money';
import { SegmentedControl } from '../SegmentedControl';
import { TextField } from '../TextField';
import { ValueChips } from '../ValueChips';

// Extras a shop adds or takes off most, one tap each; tapped again, one clears.
const EXTRA_PRESETS_RUPEES = [50, 100, 200, 300] as const;

type Sign = 'plus' | 'minus';

const signs = () =>
  [
    { value: 'plus', label: t('+ Add · जोड़ें') },
    { value: 'minus', label: t('− Reduce · घटाएं') },
  ] as const;

interface ExtraInputProps {
  ref?: React.Ref<TextInput>;
  /** The extra per meter, as typed: "100", or "-200" for a reduction. */
  value: string;
  onChange: (extra: string) => void;
  error?: string;
  /** The cloth's catalog price, so the sum can be shown. */
  pricePerMeterPaise: number;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
}

/**
 * Extra per meter, on this bill only: added to the catalog price, or taken
 * off it for a cloth that sells for less ("Royal Armani" at ₹1,000 where
 * Armani is ₹1,200 is −₹200). A phone's number keyboard has no minus key, so
 * the sign is a switch beside the amount: the box holds the digits, the
 * switch says whether they add or take off. Beneath, the usual amounts as
 * one-tap chips and — once there is one — the sum it makes with the catalog
 * price, so the rate the customer is charged is never a surprise.
 */
export const ExtraInput: React.FC<ExtraInputProps> = ({
  ref,
  value,
  onChange,
  error,
  pricePerMeterPaise,
  returnKeyType = 'done',
  onSubmitEditing,
}) => {
  const extraPaise = parseSignedRupees(value) ?? 0;
  const rate = pricePerMeterPaise + extraPaise;
  const digits = value.replace(/^[-−]/, '');

  // The sign is remembered while the box is empty, so choosing "Reduce" and
  // then typing the amount works. A value set from outside — an opened bill —
  // carries its own sign, which wins.
  const [sign, setSign] = useState<Sign>(
    /^[-−]/.test(value) ? 'minus' : 'plus'
  );
  useEffect(() => {
    if (/^[-−]/.test(value)) setSign('minus');
    else if (value.trim()) setSign('plus');
  }, [value]);

  const compose = (next: Sign, amount: string): string =>
    amount && next === 'minus' ? `-${amount}` : amount;

  const chooseSign = (next: Sign): void => {
    setSign(next);
    onChange(compose(next, digits));
  };

  return (
    <View style={styles.field}>
      <SegmentedControl options={signs()} value={sign} onChange={chooseSign} />
      <TextField
        ref={ref}
        label={t('Extra per meter · अतिरिक्त (optional)')}
        placeholder="0"
        prefix={sign === 'minus' ? '− ₹ ' : '+ ₹ '}
        value={digits}
        onChangeText={(text) => onChange(compose(sign, text))}
        error={error}
        decimal={RUPEE_LIMITS}
        returnKeyType={returnKeyType}
        submitBehavior="submit"
        onSubmitEditing={onSubmitEditing}
      />
      <ValueChips
        describes={
          sign === 'minus'
            ? t('rupees taken off per meter')
            : t('rupees extra per meter')
        }
        options={EXTRA_PRESETS_RUPEES.map((rupees) => ({
          key: String(rupees),
          label: `${sign === 'minus' ? '−' : ''}₹${rupees}`,
          selected: extraPaise === (sign === 'minus' ? -rupees : rupees) * 100,
        }))}
        onPick={(key) =>
          // Tapped again, the chosen amount clears — "no extra" is one tap.
          onChange(
            extraPaise === (sign === 'minus' ? -Number(key) : Number(key)) * 100
              ? ''
              : compose(sign, key)
          )
        }
      />
      {extraPaise !== 0 && !error ? (
        <Text
          style={[styles.breakdown, extraPaise < 0 && styles.breakdownReduced]}
        >
          {t(
            '{0} {1} {2} = {3} / meter, on this bill only',
            formatRupees(pricePerMeterPaise),
            extraPaise < 0 ? '−' : '+',
            formatRupees(Math.abs(extraPaise)),
            formatRupees(rate)
          )}
        </Text>
      ) : null}
    </View>
  );
};

const styles = themedStyles(() => ({
  field: { gap: 10 },
  breakdown: { ...TYPE.caption, color: COLORS.warning },
  breakdownReduced: { color: COLORS.success },
}));
