import React from 'react';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { metersToInput, parseMeters, stepMeters } from '../../utils/billMath';
import { METER_LIMITS } from '../../utils/inputFilters';
import { spokenMeters } from '../../voice/spokenText';
import { useAnnouncer } from '../../voice/useAnnouncer';
import { Tap } from '../Tap';
import { TextField } from '../TextField';
import { ValueChips } from '../ValueChips';

// The lengths a counter sells most, one tap each. Anything else is typed or
// stepped to with − and +.
const METER_PRESETS_CM = [100, 150, 200, 250, 300] as const;
// − and + move the length by half a meter.
const METER_STEP_CM = 50;

interface MeterInputProps {
  ref?: React.Ref<TextInput>;
  /** The meters as typed. */
  value: string;
  onChange: (meters: string) => void;
  error?: string;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
}

/**
 * The meters of a cloth, the one figure a cloth bill turns on: a big box to
 * type in, − and + beside it to step by half a meter, and the lengths a
 * counter sells most as one-tap chips beneath. Used wherever a length is
 * asked for, so it behaves the same everywhere.
 */
export const MeterInput: React.FC<MeterInputProps> = ({
  ref,
  value,
  onChange,
  error,
  returnKeyType = 'done',
  onSubmitEditing,
}) => {
  const lengthCm = parseMeters(value) ?? 0;
  const announcer = useAnnouncer();

  // Every way of changing the meters — typing, − and +, a ready-made length —
  // comes through here, so each is read out once it settles.
  const change = (meters: string): void => {
    onChange(meters);
    announcer.say(spokenMeters(parseMeters(meters)));
  };

  const stepButton = (direction: 1 | -1): React.ReactNode => (
    <Tap
      onPress={() => change(stepMeters(value, direction * METER_STEP_CM))}
      haptic="select"
      throttle={false}
      accessibilityLabel={
        direction > 0 ? t('Add half a meter') : t('Take off half a meter')
      }
      style={styles.step}
    >
      <Ionicons
        name={direction > 0 ? 'add' : 'remove'}
        size={30}
        color={COLORS.accent}
      />
    </Tap>
  );

  return (
    <>
      <TextField
        ref={ref}
        label={t('Meters · मीटर')}
        placeholder="0"
        suffix=" m"
        value={value}
        onChangeText={change}
        error={error}
        decimal={METER_LIMITS}
        size="huge"
        centered
        startAdornment={stepButton(-1)}
        endAdornment={stepButton(1)}
        returnKeyType={returnKeyType}
        submitBehavior="submit"
        onSubmitEditing={onSubmitEditing}
      />
      <ValueChips
        describes={t('meters')}
        options={METER_PRESETS_CM.map((cm) => ({
          key: String(cm),
          label: t('{0} m', metersToInput(cm)),
          selected: lengthCm === cm,
        }))}
        onPick={(key) => change(metersToInput(Number(key)))}
      />
    </>
  );
};

const styles = themedStyles(() => ({
  step: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
  },
}));
