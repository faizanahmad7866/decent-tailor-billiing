import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A press shrinks every control by the same few pixels rather than by the
// same percentage: a percentage that feels right on a 56pt button pulls a
// full-width row visibly off its dividers, and one that suits the row is
// invisible on the button. Clamped so small chips don't jump.
const PRESS_SHRINK_PX = 6;
const MIN_PRESSED_SCALE = 0.95;
const MAX_PRESSED_SCALE = 0.985;

// The scale now carries most of the feedback, so the old fade is kept but
// never allowed to wash a button out.
const MIN_PRESSED_OPACITY = 0.72;

// Going down is quick and flat; coming back is a short, well-damped spring
// that settles with the faintest overshoot — the "physical key" feel,
// rather than a linear fade that reads as a web page.
const PRESS_IN = {
  duration: 90,
  easing: Easing.out(Easing.quad),
  reduceMotion: ReduceMotion.System,
};
const RELEASE = {
  damping: 15,
  stiffness: 340,
  mass: 0.6,
  reduceMotion: ReduceMotion.System,
};

// A short hold before showing the press, so a finger that lands on a card
// and starts scrolling doesn't flash every row it crosses. A real tap that
// lifts inside this window still gets the full press animation.
const PRESS_DELAY_MS = 40;

// Taps closer together than this are one tap from a shaky finger, not two —
// it is what stops a double tap from pushing the same screen twice or
// saving the same payment twice before the busy state has rendered.
const THROTTLE_MS = 450;

export type TapHaptic = 'tap' | 'select' | 'none';

export interface TapProps extends Omit<
  PressableProps,
  'style' | 'children' | 'onPress'
> {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => unknown;
  activeOpacity?: number;
  // 'select' for tabs, segments and chips; 'none' for a press that already
  // produces its own feedback.
  haptic?: TapHaptic;
  // Off for controls meant to be tapped quickly in a row: steppers, month
  // arrows, calendar days.
  throttle?: boolean;
}

/**
 * The one pressable every button, row, card and chip in the app is built on
 * (shared with the main Decent Tailor app, so both press the same way): the
 * control physically dips under the finger and springs back, a light
 * haptic click confirms the press, a double tap counts once, and a finger
 * that is really scrolling doesn't set it off.
 */
export const Tap: React.FC<TapProps> = ({
  style,
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  onLayout,
  activeOpacity = 0.85,
  haptic = 'tap',
  throttle = true,
  disabled,
  accessibilityRole = 'button',
  unstable_pressDelay = PRESS_DELAY_MS,
  ...rest
}) => {
  const progress = useSharedValue(0);
  const pressedScale = useSharedValue(MAX_PRESSED_SCALE);
  const lastPressAt = useRef(0);

  const interactive = !disabled && (onPress != null || onLongPress != null);

  // The animated opacity is written after the caller's style, so it has to
  // carry any opacity the caller set (e.g. a half-faded disabled button)
  // rather than overwrite it.
  const flat = StyleSheet.flatten(style);
  const baseOpacity = typeof flat?.opacity === 'number' ? flat.opacity : 1;
  const pressedOpacity = Math.max(activeOpacity, MIN_PRESSED_OPACITY);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const clamped = Math.min(Math.max(p, 0), 1);
    return {
      opacity: baseOpacity * (1 - (1 - pressedOpacity) * clamped),
      transform: [{ scale: 1 - (1 - pressedScale.value) * p }],
    };
  });

  const handleLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    const largest = Math.max(width, height);
    if (largest > 0) {
      pressedScale.value = Math.min(
        Math.max(1 - PRESS_SHRINK_PX / largest, MIN_PRESSED_SCALE),
        MAX_PRESSED_SCALE
      );
    }
    onLayout?.(event);
  };

  const handlePressIn = (event: GestureResponderEvent): void => {
    if (interactive) progress.value = withTiming(1, PRESS_IN);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent): void => {
    if (interactive) progress.value = withSpring(0, RELEASE);
    onPressOut?.(event);
  };

  const handlePress = (event: GestureResponderEvent): void => {
    if (!onPress) return;
    if (throttle) {
      const now = Date.now();
      if (now - lastPressAt.current < THROTTLE_MS) return;
      lastPressAt.current = now;
    }
    if (haptic !== 'none') haptics[haptic]();
    onPress(event);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      unstable_pressDelay={unstable_pressDelay}
      onLayout={handleLayout}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};
