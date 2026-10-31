import React, { useEffect, useRef } from 'react';
import { Text, TextInput, View } from 'react-native';
import { COLORS, FONT, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { clothLineName } from '../../repositories/billRepo';
import { parseMeters } from '../../utils/billMath';
import { clothRate, type ClothEntry } from '../../utils/billForm';
import { formatRupees, parseSignedRupees } from '../../utils/money';
import { ClothNames } from '../ClothNames';
import { ClothThumb } from '../ClothThumb';
import { IconButton } from '../IconButton';
import { ClothTypeInput } from './ClothTypeInput';
import { ExtraInput } from './ExtraInput';
import { MeterInput } from './MeterInput';
import { PriceResult } from './PriceResult';

// Waits for the cloth picker to finish sliding away before opening the
// keyboard, which a closing modal would otherwise swallow.
const AUTOFOCUS_DELAY_MS = 450;

interface ClothLineEditorProps {
  entry: ClothEntry;
  /** Open on the first box (the cloth type) with the keyboard up — a line just added. */
  autoFocus?: boolean;
  errors?: { extra?: string; meters?: string };
  onChange: (patch: Partial<ClothEntry>) => void;
  onRemove: () => void;
}

/**
 * One cloth on a new bill, filled in top to bottom: the cloth type (a note
 * for the customer), the extra per meter, and last the meters, on a panel of
 * their own, large enough to hit with a thumb and with ready-made lengths to
 * tap in place of typing. Each is its own component, shared with the cloth
 * page.
 */
export const ClothLineEditor: React.FC<ClothLineEditorProps> = ({
  entry,
  autoFocus = false,
  errors,
  onChange,
  onRemove,
}) => {
  const metersInput = useRef<TextInput>(null);
  const extraInput = useRef<TextInput>(null);
  const variantInput = useRef<TextInput>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(
      () => variantInput.current?.focus(),
      AUTOFOCUS_DELAY_MS
    );
    return () => clearTimeout(timer);
    // Only when the line first appears: later edits must not steal focus.
  }, []);

  const rate = clothRate(entry);
  const extraPaise = parseSignedRupees(entry.extra) ?? 0;
  const lengthCm = parseMeters(entry.meters) ?? 0;

  return (
    <View style={styles.line}>
      <View style={styles.top}>
        <ClothThumb
          name={entry.clothName}
          imageName={entry.imageName}
          style={styles.thumb}
        />
        <View style={styles.text}>
          <ClothNames
            title={clothLineName({
              clothName: entry.clothName,
              variant: entry.variant.trim() || null,
            })}
            name={entry.clothName}
            hindi={entry.clothNameHindi}
            variant={entry.variant}
            size={18}
          />
          <Text
            style={[
              styles.rate,
              extraPaise > 0 && styles.rateRaised,
              extraPaise < 0 && styles.rateReduced,
            ]}
          >
            {t('{0} / meter', formatRupees(rate))}
          </Text>
        </View>
        <IconButton
          icon="close"
          label={t('Remove {0}', entry.clothName)}
          color={COLORS.textSecondary}
          onPress={onRemove}
        />
      </View>

      <ClothTypeInput
        ref={variantInput}
        clothId={entry.clothId}
        clothName={entry.clothName}
        value={entry.variant}
        onChange={(variant, ratePaise) =>
          onChange(
            ratePaise === undefined
              ? { variant }
              : { variant, pricePerMeterPaise: ratePaise }
          )
        }
        returnKeyType="next"
        onSubmitEditing={() => extraInput.current?.focus()}
      />

      <ExtraInput
        ref={extraInput}
        value={entry.extra}
        onChange={(extra) => onChange({ extra })}
        error={errors?.extra}
        pricePerMeterPaise={entry.pricePerMeterPaise}
        returnKeyType="next"
        onSubmitEditing={() => metersInput.current?.focus()}
      />

      <View style={styles.panel}>
        <MeterInput
          ref={metersInput}
          value={entry.meters}
          onChange={(meters) => onChange({ meters })}
          error={errors?.meters}
        />
        <PriceResult lengthCm={lengthCm} ratePaise={rate} />
      </View>
    </View>
  );
};

const styles = themedStyles(() => ({
  line: { gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 60, height: 60, borderRadius: RADIUS.md },
  text: { flex: 1, gap: 2 },
  rate: { ...TYPE.label, fontSize: 14, color: COLORS.textSecondary },
  rateRaised: { color: COLORS.warning, fontFamily: FONT.semibold },
  rateReduced: { color: COLORS.success, fontFamily: FONT.semibold },
  // The meters, the figure the price turns on, set apart on a grey tray.
  panel: {
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
}));
