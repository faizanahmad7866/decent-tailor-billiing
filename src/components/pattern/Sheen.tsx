import React from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';

interface SheenProps {
  /** Where it is in its turn, from 0 to 1. */
  loop: SharedValue<number>;
  width: number;
  height: number;
  /** How bright the band is at its middle. */
  strength?: number;
}

/**
 * A band of gold light crossing the whole screen, as across polished metal. Across in
 * the first part of the turn, then off the edge until the next, so it is an event each
 * time rather than a constant shimmer.
 */
export const Sheen: React.FC<SheenProps> = ({
  loop,
  width,
  height,
  strength = 0.2,
}) => {
  const bandWidth = width * 0.55;
  const animated = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          loop.value,
          [0, 0.45, 1],
          [-bandWidth * 1.6, width + bandWidth, width + bandWidth]
        ),
      },
      { rotate: '18deg' },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.band,
        { width: bandWidth, height: height * 1.5, top: -height * 0.25 },
        animated,
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={SHOWROOM.goldBright} stopOpacity={0} />
            <Stop
              offset="0.5"
              stopColor={SHOWROOM.goldBright}
              stopOpacity={strength}
            />
            <Stop offset="1" stopColor={SHOWROOM.goldBright} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sheen)" />
      </Svg>
    </Animated.View>
  );
};

const styles = themedStyles(() => ({
  band: { position: 'absolute', left: 0 },
}));
