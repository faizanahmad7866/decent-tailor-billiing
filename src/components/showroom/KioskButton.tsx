import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { Tap } from '../Tap';

type Variant = 'solid' | 'outline' | 'quiet';

interface KioskButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** The icon after the words, as an arrow onward reads. */
  iconAfter?: boolean;
  /** Solid ivory for the one thing to do; outline beside it; quiet for the rest. */
  variant?: Variant;
  /** Large, for a screen across a counter. */
  large?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** A button of the showroom: square-cornered, spaced, no colour of its own. */
export const KioskButton: React.FC<KioskButtonProps> = ({
  label,
  onPress,
  icon,
  iconAfter = false,
  variant = 'outline',
  large = false,
  accessibilityLabel,
  style,
}) => {
  const ink = variant === 'solid' ? SHOWROOM.onLight : SHOWROOM.text;
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.button,
        large && styles.large,
        variant === 'solid' && styles.solid,
        variant === 'outline' && styles.outline,
        variant === 'quiet' && styles.quiet,
        style,
      ]}
    >
      <View style={[styles.inner, iconAfter && styles.innerReversed]}>
        {icon ? (
          <Ionicons name={icon} size={large ? 20 : 18} color={ink} />
        ) : null}
        <Text
          numberOfLines={1}
          style={[styles.label, large && styles.labelLarge, { color: ink }]}
        >
          {label}
        </Text>
      </View>
    </Tap>
  );
};

const styles = themedStyles(() => ({
  button: {
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 2,
  },
  large: { height: 56, paddingHorizontal: 28 },
  solid: { backgroundColor: SHOWROOM.text },
  outline: { borderWidth: 1, borderColor: SHOWROOM.lineStrong },
  quiet: { paddingHorizontal: 12 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  innerReversed: { flexDirection: 'row-reverse' },
  label: { fontFamily: FONT.medium, fontSize: 14, letterSpacing: 0.3 },
  labelLarge: { fontSize: 15 },
}));
