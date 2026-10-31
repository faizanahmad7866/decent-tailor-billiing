import React, { useEffect, useRef } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { SHOP } from '../../print/shop';
import { Reveal } from './Reveal';
import { showroomType } from './showroomType';

const logo = require('../../../assets/brand/logo-gold.png');

const BUILD_MS = 1600;
// How long the shop's name stands before it gives way to the designs.
const HOLD_MS = 2600;
const FADE_MS = 700;

/**
 * The opening of the showroom, as a house opens a show: the logo comes up out of
 * the dark, a line is drawn under it, and the shop's motto follows in italic. A
 * tap skips it.
 */
export const ShowroomIntro: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { width, height } = useWindowDimensions();
  const build = useSharedValue(0);
  const fade = useSharedValue(1);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    build.value = withTiming(1, {
      duration: BUILD_MS,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
    fade.value = withDelay(
      HOLD_MS,
      withTiming(0, { duration: FADE_MS, reduceMotion: ReduceMotion.System })
    );
    const timer = setTimeout(() => done.current(), HOLD_MS + FADE_MS);
    return () => clearTimeout(timer);
  }, [build, fade]);

  const page = useAnimatedStyle(() => ({ opacity: fade.value }));
  const rule = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.min(1, Math.max(0, build.value * 1.6 - 0.45)) }],
  }));

  const logoHeight = Math.round(Math.min(width, height) * 0.24);
  const source = Image.resolveAssetSource(logo);

  return (
    <Animated.View style={[styles.page, page]}>
      <Pressable style={styles.tap} onPress={onDone}>
        <Reveal build={build} from={0} to={0.55} rise={0} grow={0.04}>
          <Image
            source={logo}
            resizeMode="contain"
            style={{
              height: logoHeight,
              width: (logoHeight * source.width) / source.height,
            }}
          />
        </Reveal>
        <Animated.View style={[styles.rule, rule]} />
        <Reveal build={build} from={0.5} to={1} rise={6}>
          <Text style={[showroomType.displayItalic, styles.motto]}>
            {SHOP.tagline}
          </Text>
        </Reveal>
      </Pressable>
    </Animated.View>
  );
};

const styles = themedStyles(() => ({
  page: { ...StyleSheet.absoluteFill, backgroundColor: SHOWROOM.ground },
  tap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  rule: { width: 96, height: 1, backgroundColor: SHOWROOM.goldDeep },
  motto: { fontSize: 24, color: SHOWROOM.textMuted },
}));
