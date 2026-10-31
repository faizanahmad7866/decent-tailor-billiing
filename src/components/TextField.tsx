import React, { useRef, useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import {
  sanitizeDecimal,
  sanitizeDigits,
  type DecimalLimits,
} from '../utils/inputFilters';
import { useScrollIntoView } from './KeyboardAwareScroll';
import { Tap } from './Tap';

type FieldSize = 'regular' | 'large' | 'huge';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  ref?: React.Ref<TextInput>;
  label: string;
  /** Shown under the field until there is an error to show instead. */
  hint?: string;
  error?: string;
  /** Fixed text in the box around what is typed: "₹" … "/ meter". */
  prefix?: string;
  suffix?: string;
  /**
   * Box and type size: large for a figure that matters, huge for the one the
   * whole form is about (a length in meters).
   */
  size?: FieldSize;
  /** Centres what is typed — for a figure with buttons either side of it. */
  centered?: boolean;
  /** Controls inside the box at either end, e.g. a − and a +. */
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  /**
   * An amount or a length: digits and one point, within these limits. The
   * number keyboard comes up, a comma becomes the point, and nothing else can
   * be typed. Tapping into a filled field selects it, so the next thing typed
   * replaces it.
   */
  decimal?: DecimalLimits;
  /** A whole number of at most this many digits — a mobile number. */
  digits?: number;
  /** A ✕ at the end while focused and not empty, to wipe the field. */
  clearable?: boolean;
}

/**
 * A labelled input. The label sits above the box rather than inside it, so
 * it is still readable once the field is filled in. Inside a
 * KeyboardAwareScroll it also brings itself into view when focused.
 */
export const TextField: React.FC<TextFieldProps> = ({
  ref,
  label,
  hint,
  error,
  prefix,
  suffix,
  size = 'regular',
  centered = false,
  startAdornment,
  endAdornment,
  decimal,
  digits,
  clearable = false,
  onChangeText,
  onFocus,
  onBlur,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);
  const wrapper = useRef<View>(null);
  const scrollIntoView = useScrollIntoView();
  const borderColor = error
    ? COLORS.danger
    : focused
      ? COLORS.primary
      : COLORS.borderStrong;
  const note = error ?? hint;
  // "Name (optional)": the field's name in full weight, the "optional" quiet
  // beside it, so the eye finds what to fill in first.
  const [, labelName = label, optional] =
    /^(.*?)(\s*\((?:optional|वैकल्पिक)\))?$/.exec(label) ?? [];

  // What the field takes is decided here, before the screen ever sees it.
  const handleChange = (text: string): void => {
    if (decimal) onChangeText?.(sanitizeDecimal(text, decimal));
    else if (digits !== undefined) onChangeText?.(sanitizeDigits(text, digits));
    else onChangeText?.(text);
  };

  const showClear = clearable && focused && !!inputProps.value;

  return (
    <View ref={wrapper}>
      <Text style={styles.label}>
        {labelName}
        {optional ? <Text style={styles.optional}>{optional}</Text> : null}
      </Text>
      <View
        style={[
          styles.box,
          { borderColor },
          // The border thickens on focus; padding gives back the extra so
          // the text doesn't shift.
          size === 'large' && styles.boxLarge,
          size === 'huge' && styles.boxHuge,
          inputProps.multiline && styles.boxMultiline,
          (focused || !!error) && styles.boxActive,
          // Adornments sit close to the edge of the box.
          !!(startAdornment || endAdornment) &&
            (focused || error ? styles.boxAdornedActive : styles.boxAdorned),
          focused && !error && styles.boxFocused,
        ]}
      >
        {startAdornment}
        {prefix ? (
          <Text style={[styles.affix, size === 'huge' && styles.affixHuge]}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          // A number field says what keyboard it wants and selects on tap;
          // anything the screen passes still wins.
          keyboardType={
            decimal
              ? 'decimal-pad'
              : digits !== undefined
                ? 'number-pad'
                : undefined
          }
          selectTextOnFocus={decimal !== undefined}
          {...inputProps}
          onChangeText={handleChange}
          accessibilityLabel={label}
          placeholderTextColor={COLORS.textMuted}
          selectionColor={COLORS.primaryTintStrong}
          cursorColor={COLORS.accent}
          onFocus={(event) => {
            setFocused(true);
            scrollIntoView?.(wrapper.current);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            size === 'large' && styles.inputLarge,
            size === 'huge' && styles.inputHuge,
            centered && styles.inputCentered,
            inputProps.multiline && styles.inputMultiline,
          ]}
        />
        {suffix ? (
          <Text style={[styles.affix, size === 'huge' && styles.affixHuge]}>
            {suffix}
          </Text>
        ) : null}
        {showClear ? (
          <Tap
            onPress={() => handleChange('')}
            haptic="none"
            throttle={false}
            accessibilityLabel={t('Clear {0}', label)}
            style={styles.clear}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </Tap>
        ) : null}
        {endAdornment}
      </View>
      {note ? (
        <View style={styles.noteRow}>
          {error ? (
            <Ionicons
              name="alert-circle"
              size={15}
              color={COLORS.danger}
              style={styles.noteIcon}
            />
          ) : null}
          <Text
            accessibilityLiveRegion={error ? 'polite' : 'none'}
            style={[styles.note, error ? styles.error : null]}
          >
            {note}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = themedStyles(() => ({
  label: {
    ...TYPE.label,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  box: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  boxLarge: { height: 66 },
  boxHuge: { height: 88 },
  // A note: as tall as its lines, not one line of a fixed box.
  boxMultiline: {
    height: undefined,
    minHeight: 84,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  boxAdorned: { paddingHorizontal: 8 },
  boxAdornedActive: { paddingHorizontal: 7 },
  boxActive: { borderWidth: 2, paddingHorizontal: 14 },
  // A faint wash of the brand blue while typing, so the field in use is
  // obvious at a glance even on a long form.
  boxFocused: { backgroundColor: COLORS.primaryWash },
  input: {
    flex: 1,
    // Else a large figure's own width pushes the buttons beside it out of the box.
    minWidth: 0,
    height: '100%',
    ...TYPE.body,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  inputLarge: { fontFamily: FONT.bold, fontSize: 26 },
  inputHuge: { fontFamily: FONT.extrabold, fontSize: 40 },
  inputCentered: { textAlign: 'center' },
  inputMultiline: {
    height: undefined,
    minHeight: 62,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  affix: { ...TYPE.body, fontSize: 16, color: COLORS.textSecondary },
  affixHuge: { fontFamily: FONT.bold, fontSize: 24 },
  clear: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optional: { fontFamily: FONT.regular, color: COLORS.textMuted },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  noteIcon: { marginRight: 5, marginTop: 1 },
  note: { ...TYPE.caption, flex: 1, color: COLORS.textSecondary },
  error: { color: COLORS.danger },
}));
