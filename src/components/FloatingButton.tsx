import React from 'react';
import {} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { useBottomInset } from '../layout/useBottomInset';
import { useLayout } from '../layout/useLayout';
import { Button } from './Button';
import { Tap } from './Tap';

/** Room a list leaves under its last row to scroll clear of this button. */
export const FLOATING_BUTTON_CLEARANCE = 112;

interface FloatingButtonProps {
  /** Written on the button — or, with `iconOnly`, only read aloud. */
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** A round button with just the icon, for an action everyone knows by its sign. */
  iconOnly?: boolean;
}

/** A page's main action, floating at the bottom right above the content. */
export const FloatingButton: React.FC<FloatingButtonProps> = ({
  iconOnly = false,
  ...props
}) => {
  const { gutter } = useLayout();
  const position = { bottom: useBottomInset() + 16, right: gutter };

  if (iconOnly) {
    return (
      <Tap
        onPress={props.onPress}
        accessibilityLabel={props.label}
        style={[styles.circle, position]}
      >
        <Ionicons name={props.icon} size={30} color={COLORS.onPrimary} />
      </Tap>
    );
  }
  return <Button {...props} style={[styles.button, position]} />;
};

const CIRCLE_SIZE = 64;

const styles = themedStyles(() => ({
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    ...SHADOW.raised,
  },
  button: {
    position: 'absolute',
    height: 56,
    borderRadius: RADIUS.md,
    paddingLeft: 20,
    paddingRight: 24,
    ...SHADOW.raised,
  },
}));
