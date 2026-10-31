import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { FONT, OFFER, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { shownDate } from '../../i18n/dates';
import { t } from '../../i18n/t';
import { daysLeft, offerTitleSize, type Offer } from '../../utils/offers';
import { Reveal } from './Reveal';
import { Sheen } from './Sheen';

interface OfferSlideProps {
  offer: Offer;
  width: number;
  height: number;
  /** The slide on screen: it builds up, and only then does anything move. */
  active: boolean;
}

const DEVANAGARI = /[\u0900-\u097F]/;

// How long the offer takes to build up, and one turn of what keeps moving after.
const BUILD_MS = 1200;
const LOOP_MS = 3200;

/** A ring spreading out from the medal and fading, again and again. */
const Ring: React.FC<{
  loop: SharedValue<number>;
  phase: number;
  size: number;
}> = ({ loop, phase, size }) => {
  const animated = useAnimatedStyle(() => {
    const at = (loop.value + phase) % 1;
    return { opacity: (1 - at) * 0.55, transform: [{ scale: 1 + at * 0.95 }] };
  });
  return (
    <Animated.View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
        animated,
      ]}
    />
  );
};

// Where the points of light sit, as shares of the slide: above and below the words,
// never across them, whatever their length.
const SPARKS = [
  { x: 0.13, y: 0.17, size: 18, phase: 0 },
  { x: 0.84, y: 0.14, size: 24, phase: 0.3 },
  { x: 0.08, y: 0.33, size: 14, phase: 0.62 },
  { x: 0.9, y: 0.34, size: 16, phase: 0.15 },
  { x: 0.18, y: 0.86, size: 20, phase: 0.45 },
  { x: 0.82, y: 0.84, size: 14, phase: 0.8 },
];

const Spark: React.FC<{
  loop: SharedValue<number>;
  phase: number;
  size: number;
  style: ViewStyle;
}> = ({ loop, phase, size, style }) => {
  const animated = useAnimatedStyle(() => {
    const glow = Math.sin(((loop.value + phase) % 1) * Math.PI) ** 2;
    return { opacity: glow, transform: [{ scale: 0.6 + glow * 0.5 }] };
  });
  return (
    <Animated.View style={[styles.spark, style, animated]}>
      <Ionicons name="sparkles" size={size} color={OFFER.gold} />
    </Animated.View>
  );
};

const urgencyOf = (days: number): string => {
  if (days <= 0) return t('Last day today');
  return days === 1 ? t('Only 1 day left') : t('Only {0} days left', days);
};

/**
 * An offer as a poster, the way a good brand's would be: near-black, one metal, one
 * very large line, and nothing else asking for attention. The medal rings, points of
 * light come and go at the edges, a band of light crosses it, and the time left
 * pulses, so an eye passing the counter is caught and comes back. Its colours are
 * its own and do not follow dark mode: a poster looks the same on any phone.
 */
export const OfferSlide: React.FC<OfferSlideProps> = ({
  offer,
  width,
  height,
  active,
}) => {
  const build = useSharedValue(0);
  const loop = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(build);
      cancelAnimation(loop);
      build.value = 0;
      loop.value = 0;
      return;
    }
    build.value = withTiming(1, {
      duration: BUILD_MS,
      easing: Easing.out(Easing.cubic),
    });
    loop.value = withRepeat(
      withTiming(1, { duration: LOOP_MS, easing: Easing.linear }),
      -1,
      false
    );
  }, [active, build, loop]);

  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.sin(loop.value * Math.PI * 4) * 0.025 }],
  }));

  const titleSize = offerTitleSize(offer.title, width, height);
  const medal = Math.round(Math.min(height * 0.13, 96));
  const occasion = offer.occasion.trim() || t('Special offer');

  return (
    <View
      accessibilityLabel={[offer.occasion, offer.title, offer.note]
        .filter(Boolean)
        .join(', ')}
      style={[styles.poster, { width, height }]}
    >
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <RadialGradient
            id="offerGlow"
            cx="50%"
            cy="44%"
            rx="72%"
            ry="50%"
            fx="50%"
            fy="44%"
          >
            <Stop offset="0" stopColor={OFFER.goldDeep} stopOpacity={0.5} />
            <Stop offset="0.6" stopColor={OFFER.goldDeep} stopOpacity={0.12} />
            <Stop offset="1" stopColor={OFFER.goldDeep} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#offerGlow)" />
      </Svg>

      <Sheen loop={loop} width={width} height={height} />

      {SPARKS.map((spark) => (
        <Spark
          key={spark.phase}
          loop={loop}
          phase={spark.phase}
          size={spark.size}
          style={{ left: spark.x * width, top: spark.y * height }}
        />
      ))}

      <View pointerEvents="none" style={styles.frameOuter} />
      <View pointerEvents="none" style={styles.frameInner} />

      <View style={styles.content}>
        <Reveal build={build} from={0} to={0.45} rise={0} grow={0.4}>
          <View style={[styles.medalArea, { height: medal * 1.5 }]}>
            <Ring loop={loop} phase={0} size={medal} />
            <Ring loop={loop} phase={0.5} size={medal} />
            <Svg width={medal} height={medal}>
              <Defs>
                <LinearGradient id="offerMedal" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={OFFER.goldBright} />
                  <Stop offset="1" stopColor={OFFER.goldDeep} />
                </LinearGradient>
              </Defs>
              <Circle
                cx={medal / 2}
                cy={medal / 2}
                r={medal / 2}
                fill="url(#offerMedal)"
              />
            </Svg>
            <View style={styles.medalIcon}>
              <Ionicons
                name={offer.icon}
                size={medal * 0.5}
                color={OFFER.ground}
              />
            </View>
          </View>
        </Reveal>

        <Reveal build={build} from={0.15} to={0.55}>
          <View style={styles.occasion}>
            <View style={styles.rule} />
            <Text
              numberOfLines={1}
              style={[
                styles.occasionText,
                // Spaced out, unless it is in Hindi, which spacing breaks apart.
                !DEVANAGARI.test(occasion) && styles.occasionSpaced,
              ]}
            >
              {occasion}
            </Text>
            <View style={styles.rule} />
          </View>
        </Reveal>

        <Reveal build={build} from={0.25} to={0.8} rise={0} grow={0.18}>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={[
              styles.title,
              { fontSize: titleSize, lineHeight: titleSize * 1.28 },
            ]}
          >
            {offer.title}
          </Text>
        </Reveal>

        {offer.note.trim() ? (
          <Reveal build={build} from={0.5} to={0.85}>
            <Text numberOfLines={2} style={styles.note}>
              {offer.note}
            </Text>
          </Reveal>
        ) : null}

        <Reveal build={build} from={0.65} to={1}>
          <Animated.View style={[styles.urgency, pulse]}>
            <Ionicons name="time" size={18} color={OFFER.onUrgent} />
            <Text style={styles.urgencyText}>
              {urgencyOf(daysLeft(offer.endsAt))}
            </Text>
          </Animated.View>
        </Reveal>

        <Reveal build={build} from={0.75} to={1}>
          <Text style={styles.until}>
            {t('Till {0}', shownDate(offer.endsAt))}
            {'  ·  '}
            {t('Ask at the counter')}
          </Text>
        </Reveal>
      </View>
    </View>
  );
};

const FILL = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

const styles = themedStyles(() => ({
  poster: { overflow: 'hidden', backgroundColor: OFFER.ground },
  sheen: { position: 'absolute', left: 0 },
  spark: { position: 'absolute' },
  frameOuter: {
    ...FILL,
    margin: 14,
    borderWidth: 1,
    borderColor: OFFER.goldLine,
  },
  frameInner: {
    ...FILL,
    margin: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OFFER.goldLine,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 26,
    paddingVertical: 34,
  },
  medalArea: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: OFFER.gold,
  },
  medalIcon: {
    ...FILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  occasion: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { width: 30, height: 1, backgroundColor: OFFER.gold },
  occasionText: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    textTransform: 'uppercase',
    color: OFFER.gold,
  },
  occasionSpaced: { letterSpacing: 3 },
  title: {
    fontFamily: FONT.bold,
    textAlign: 'center',
    color: OFFER.goldBright,
    textShadowColor: OFFER.goldDeep,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
    // Room for the glow to fade out in: a shadow is cut off at the edge of its text.
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  note: {
    ...TYPE.title,
    fontFamily: FONT.medium,
    textAlign: 'center',
    color: OFFER.text,
  },
  urgency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: OFFER.urgent,
  },
  urgencyText: {
    fontFamily: FONT.bold,
    fontSize: 15,
    color: OFFER.onUrgent,
  },
  until: { ...TYPE.label, textAlign: 'center', color: OFFER.textMuted },
}));
