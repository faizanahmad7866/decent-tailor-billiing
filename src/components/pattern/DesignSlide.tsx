import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  Ellipse,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { FONT, SHOWROOM, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { isHindiText, shownCategory } from '../../i18n/names';
import { t } from '../../i18n/t';
import type { ShowroomDesign } from '../../repositories/patternRepo';
import { designHindi } from '../../utils/designHindi';
import { designPriceText } from '../../utils/patternPricing';
import {
  designNameSize,
  photoFadeStarts,
  SHOWROOM_PHOTOS_SHOWN,
  showroomSlideMs,
} from '../../utils/showroom';
import { PatternPhoto } from './PatternPhoto';
import { Reveal } from './Reveal';
import { Sheen } from './Sheen';

// The room above the photo for the logo and the tabs, and for the photo to grow into
// as it drifts closer, without reaching them.
const TOP_BAR = 100;
const BUILD_MS = 1300;
const PHOTO_FADE_MS = 900;
// One band of light across the slide every so often, softly: the design is the subject.
const SHEEN_LOOP_MS = 3600;
// How much closer the camera drifts while a design is on show.
const DRIFT = 1.07;

interface DesignSlideProps {
  design: ShowroomDesign;
  /** Its place among the slides, to work out how far it is from the middle. */
  position: number;
  /** How far the slides have been moved along. */
  scrollX: SharedValue<number>;
  width: number;
  height: number;
  /** Clear of the phone's own bars. */
  bottomInset: number;
  /** The slide on show, with nothing open over it. */
  active: boolean;
  showPrice: boolean;
  onOpen: () => void;
}

/** One of a design's photos, seen while the fade between them is near its turn. */
const FadingPhoto: React.FC<{
  name: string;
  turn: number;
  shown: SharedValue<number>;
}> = ({ name, turn, shown }) => {
  const animated = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(shown.value - turn)),
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, animated]}>
      <PatternPhoto name={name} resizeMode="contain" style={styles.photo} />
    </Animated.View>
  );
};

/**
 * A design as a jeweller would show a piece: the dark, one warm light from above, the
 * garment standing in it, and its name in ivory and gold. The photo drifts slowly closer, the
 * design's other photos fade in turn, and the words come in one after another. A
 * neighbouring slide sits smaller and dimmer, so a swipe has depth. On a screen on
 * its side the words stand beside the photo rather than under it.
 */
export const DesignSlide: React.FC<DesignSlideProps> = ({
  design,
  position,
  scrollX,
  width,
  height,
  bottomInset,
  active,
  showPrice,
  onOpen,
}) => {
  const build = useSharedValue(0);
  const drift = useSharedValue(1);
  const photoAt = useSharedValue(0);
  const sheen = useSharedValue(0);

  const photos = design.images.slice(0, SHOWROOM_PHOTOS_SHOWN);
  const slideMs = showroomSlideMs(design.images.length);

  useEffect(() => {
    if (!active) {
      cancelAnimation(build);
      cancelAnimation(drift);
      cancelAnimation(photoAt);
      cancelAnimation(sheen);
      sheen.value = 0;
      build.value = 0;
      drift.value = 1;
      photoAt.value = 0;
      return;
    }
    build.value = withDelay(
      250,
      withTiming(1, { duration: BUILD_MS, easing: Easing.out(Easing.cubic) })
    );
    drift.value = withTiming(DRIFT, {
      duration: slideMs + 1000,
      easing: Easing.linear,
    });
    sheen.value = withRepeat(
      withTiming(1, { duration: SHEEN_LOOP_MS, easing: Easing.linear }),
      -1,
      false
    );
    const fades = photoFadeStarts(slideMs, photos.length, PHOTO_FADE_MS).map(
      (startMs, turn) =>
        setTimeout(() => {
          photoAt.value = withTiming(turn + 1, { duration: PHOTO_FADE_MS });
        }, startMs)
    );
    return () => fades.forEach(clearTimeout);
  }, [active, photos.length, slideMs, build, drift, photoAt, sheen]);

  const stage = useAnimatedStyle(() => {
    const places = [
      (position - 1) * width,
      position * width,
      (position + 1) * width,
    ];
    return {
      opacity: interpolate(
        scrollX.value,
        places,
        [0.15, 1, 0.15],
        Extrapolation.CLAMP
      ),
      transform: [
        // Lags behind the swipe a little, as something further off does.
        {
          translateX: interpolate(
            scrollX.value,
            places,
            [-width * 0.22, 0, width * 0.22],
            Extrapolation.CLAMP
          ),
        },
        {
          scale:
            drift.value *
            interpolate(
              scrollX.value,
              places,
              [0.82, 1, 0.82],
              Extrapolation.CLAMP
            ),
        },
      ],
    };
  });

  const wide = width > height;
  const hindi = designHindi(design.name);
  const category = shownCategory(design.categoryName);
  const nameSize = designNameSize(design.name, wide);

  const words = (
    <>
      <Reveal build={build} from={0} to={0.4}>
        <Text
          numberOfLines={1}
          style={[styles.category, !isHindiText(category) && styles.spaced]}
        >
          {category}
        </Text>
      </Reveal>
      <Reveal build={build} from={0.12} to={0.6} rise={22}>
        <Text
          numberOfLines={3}
          style={[
            styles.name,
            { fontSize: nameSize, lineHeight: nameSize * 1.2 },
          ]}
        >
          {design.name}
        </Text>
      </Reveal>
      {hindi ? (
        <Reveal build={build} from={0.3} to={0.72}>
          <Text numberOfLines={2} style={styles.hindi}>
            {hindi}
          </Text>
        </Reveal>
      ) : null}
      <Reveal build={build} from={0.45} to={0.85} rise={0}>
        <View style={styles.rule} />
      </Reveal>
      <Reveal build={build} from={0.55} to={1}>
        <View style={styles.foot}>
          {showPrice ? (
            <Text style={styles.price}>
              {t(designPriceText(design.pricePaise))}
            </Text>
          ) : null}
          <View style={styles.hint}>
            <Ionicons name="cube-outline" size={15} color={SHOWROOM.gold} />
            <Text style={styles.hintText}>{t('Tap to see in 3D')}</Text>
          </View>
        </View>
      </Reveal>
    </>
  );

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={design.name}
      style={[styles.slide, { width, height }]}
    >
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <RadialGradient
            id={`spot${design.id}`}
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
          >
            <Stop offset="0" stopColor={SHOWROOM.light} stopOpacity={0.36} />
            <Stop
              offset="0.55"
              stopColor={SHOWROOM.goldDeep}
              stopOpacity={0.12}
            />
            <Stop offset="1" stopColor={SHOWROOM.goldDeep} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {wide ? (
          <Rect
            x={width * 0.32}
            width={width * 0.68}
            height={height}
            fill={`url(#spot${design.id})`}
          />
        ) : (
          <Ellipse
            cx={width / 2}
            cy={height * 0.38}
            rx={width * 0.72}
            ry={height * 0.36}
            fill={`url(#spot${design.id})`}
          />
        )}
      </Svg>

      <Animated.View
        style={[
          wide ? styles.stageWide : styles.stage,
          { bottom: wide ? bottomInset + 24 : bottomInset + 190 },
          stage,
        ]}
      >
        {photos.map((name, turn) => (
          <FadingPhoto key={name} name={name} turn={turn} shown={photoAt} />
        ))}
      </Animated.View>

      <View
        style={[
          wide ? styles.wordsWide : styles.words,
          !wide && { bottom: bottomInset + 34 },
        ]}
      >
        {words}
      </View>
      <Sheen loop={sheen} width={width} height={height} strength={0.14} />
    </Pressable>
  );
};

const styles = themedStyles(() => ({
  slide: { overflow: 'hidden', backgroundColor: SHOWROOM.ground },
  stage: { position: 'absolute', top: TOP_BAR, left: 16, right: 16 },
  stageWide: { position: 'absolute', top: TOP_BAR, left: '40%', right: 32 },
  photo: { flex: 1, backgroundColor: 'transparent' },
  words: { position: 'absolute', left: 24, right: 24, gap: 6 },
  wordsWide: {
    position: 'absolute',
    top: TOP_BAR,
    bottom: 40,
    left: 48,
    width: '34%',
    justifyContent: 'center',
    gap: 8,
  },
  category: {
    fontFamily: FONT.medium,
    fontSize: 13,
    textTransform: 'uppercase',
    color: SHOWROOM.gold,
  },
  spaced: { letterSpacing: 3 },
  // The glow fades out inside this padding: a shadow is cut off at the edge of its text.
  name: {
    fontFamily: FONT.semibold,
    color: SHOWROOM.text,
    marginLeft: -8,
    paddingHorizontal: 8,
    textShadowColor: SHOWROOM.goldDeep,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  hindi: { ...TYPE.body, fontSize: 17, color: SHOWROOM.textMuted },
  rule: {
    width: 44,
    height: 1,
    marginVertical: 6,
    backgroundColor: SHOWROOM.gold,
  },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  price: {
    fontFamily: FONT.semibold,
    fontSize: 24,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.goldBright,
  },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { ...TYPE.caption, color: SHOWROOM.textMuted },
}));
