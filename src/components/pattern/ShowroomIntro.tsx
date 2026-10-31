import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { FONT, SHOWROOM, tracking } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { SHOP } from '../../print/shop';
import { Reveal } from './Reveal';
import { Sheen } from './Sheen';

const logo = require('../../../assets/brand/logo-gold.png');
const logoSource = Image.resolveAssetSource(logo);
const LOGO_HEIGHT = 110;
const RULE_WIDTH = 170;

// When the light crosses the logo, once it has come in.
const SHEEN_DELAY_MS = 600;
const SHEEN_MS = 2600;

// How long the shop's name stands before it gives way to the first design.
const HOLD_MS = 2100;
const FADE_MS = 500;

/**
 * The opening of the showroom: the shop's gold logo on the dark, a line of gold drawn
 * out under it, its tagline, and one band of light across it all. A tap skips it, for a customer in a hurry.
 */
export const ShowroomIntro: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const build = useSharedValue(0);
  const fade = useSharedValue(1);
  const sheen = useSharedValue(0);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    build.value = withTiming(1, {
      duration: 1300,
      easing: Easing.out(Easing.cubic),
    });
    sheen.value = withDelay(
      SHEEN_DELAY_MS,
      withTiming(1, { duration: SHEEN_MS, easing: Easing.linear })
    );
    fade.value = withDelay(HOLD_MS, withTiming(0, { duration: FADE_MS }));
    const timer = setTimeout(onDone, HOLD_MS + FADE_MS);
    return () => clearTimeout(timer);
  }, [build, fade, sheen, onDone]);

  const page = useAnimatedStyle(() => ({ opacity: fade.value }));
  const rule = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.min(1, Math.max(0, build.value * 1.4 - 0.4)) }],
  }));

  return (
    <Animated.View style={[styles.page, page]}>
      <Pressable style={styles.tap} onPress={onDone}>
        <Reveal build={build} from={0} to={0.6} rise={0} grow={0.12}>
          <Image
            source={logo}
            resizeMode="contain"
            style={{
              height: LOGO_HEIGHT,
              width: (LOGO_HEIGHT * logoSource.width) / logoSource.height,
            }}
          />
        </Reveal>
        <Animated.View style={[styles.rule, rule]} />
        <Reveal build={build} from={0.55} to={1} rise={8}>
          <Text style={styles.tagline}>{SHOP.tagline}</Text>
        </Reveal>
      </Pressable>
      <Sheen loop={sheen} width={width} height={height} strength={0.28} />
    </Animated.View>
  );
};

const styles = themedStyles(() => ({
  page: { ...StyleSheet.absoluteFill, backgroundColor: SHOWROOM.ground },
  tap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  rule: { width: RULE_WIDTH, height: 1, backgroundColor: SHOWROOM.gold },
  tagline: {
    fontFamily: FONT.regular,
    fontSize: 14,
    letterSpacing: tracking(4),
    textTransform: 'uppercase',
    color: SHOWROOM.gold,
  },
}));
