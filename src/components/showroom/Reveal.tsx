import React from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

/** Comes in over its share of a slide's build-up, rising a little as it does. */
export const Reveal: React.FC<{
  build: SharedValue<number>;
  from: number;
  to: number;
  rise?: number;
  grow?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}> = ({ build, from, to, rise = 14, grow = 0, style, children }) => {
  const animated = useAnimatedStyle(() => {
    const shown = interpolate(
      build.value,
      [from, to],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: shown,
      transform: [
        { translateY: (1 - shown) * rise },
        { scale: 1 - (1 - shown) * grow },
      ],
    };
  });
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
};
