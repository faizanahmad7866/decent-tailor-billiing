import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import type { ShowroomDesign } from '../../repositories/patternRepo';
import { OFFER_SLIDE_MS, type ShowroomSlide } from '../../utils/offers';
import { showroomSlideMs } from '../../utils/showroom';
import { AttractDesign, type AttractFrame } from './AttractDesign';
import { KioskButton } from './KioskButton';
import { OfferPoster } from './OfferPoster';

const logo = require('../../../assets/brand/logo-gold.png');

export type AttractSlide = ShowroomSlide<ShowroomDesign>;

// Long enough that a customer resting a thumb on the logo does not get the PIN box.
export const EXIT_HOLD_MS = 2000;
const CROSSFADE_IN_MS = 1000;
const CROSSFADE_OUT_MS = 800;

interface AttractViewProps {
  slides: AttractSlide[];
  showPrice: boolean;
  /** Each slide as it comes up, for the voice. */
  onSlide: (slide: AttractSlide) => void;
  /** Into the showroom: the design touched, or the whole collection. */
  onExplore: (designId: number | null) => void;
  /** The logo held down: the tailor's way out. */
  onHoldLogo: () => void;
  /** Held still while something is open over it. */
  paused: boolean;
}

const twoDigits = (value: number): string => String(value).padStart(2, '0');

/**
 * The showroom when no one is using it: the designs one after another, each in its
 * own light, with the offers among them, for anyone passing to stop at. It plays
 * by itself, a hairline counting down to the next, and one button asks to be
 * touched. A touch on a design opens that design.
 */
export const AttractView: React.FC<AttractViewProps> = ({
  slides,
  showPrice,
  onSlide,
  onExplore,
  onHoldLogo,
  paused,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);
  const onSlideNow = useRef(onSlide);
  onSlideNow.current = onSlide;

  const at = slides.length ? index % slides.length : 0;
  const current = slides[at];
  const slideMs =
    current?.kind === 'design'
      ? showroomSlideMs(current.design.images.length)
      : OFFER_SLIDE_MS;

  useEffect(() => {
    if (current) onSlideNow.current(current);
  }, [current]);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (paused || slides.length < 2) return;
    progress.value = withTiming(1, {
      duration: slideMs,
      easing: Easing.linear,
    });
    const timer = setTimeout(
      () => setIndex((now) => (now + 1) % slides.length),
      slideMs
    );
    return () => clearTimeout(timer);
  }, [at, paused, slideMs, slides.length, progress]);

  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  if (!current) return null;

  const wide = width > height;
  const gutter = wide ? 56 : 24;
  const column = wide ? Math.min(Math.max(width * 0.4, 340), 520) : null;
  const frame: AttractFrame = {
    top: insets.top + (wide ? 104 : 76),
    bottom: insets.bottom + (wide ? 168 : 132),
    column,
    photoTop: insets.top + 28,
    photoBottom: insets.bottom + 28,
    gutter,
  };
  const source = Image.resolveAssetSource(logo);
  const logoHeight = wide ? 40 : 34;
  const [touch, touchHindi] = t('Touch to explore · देखने के लिए छुएँ').split(
    ' · '
  );

  return (
    <View style={styles.page}>
      <Animated.View
        key={current.key}
        entering={FadeIn.duration(CROSSFADE_IN_MS)}
        exiting={FadeOut.duration(CROSSFADE_OUT_MS)}
        style={StyleSheet.absoluteFill}
      >
        {current.kind === 'design' ? (
          <AttractDesign
            design={current.design}
            slideMs={slideMs}
            width={width}
            frame={frame}
            showPrice={showPrice}
            onOpen={() => onExplore(current.design.id)}
          />
        ) : (
          <Pressable
            onPress={() => onExplore(null)}
            style={[
              styles.offer,
              {
                paddingTop: frame.top,
                paddingBottom: frame.bottom,
                paddingLeft: wide ? (column ?? 0) * 0.15 : 0,
              },
            ]}
          >
            <OfferPoster
              offer={current.offer}
              width={width - (wide ? (column ?? 0) * 0.3 : 0)}
              height={height - frame.top - frame.bottom}
            />
          </Pressable>
        )}
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={[
          styles.top,
          {
            top: insets.top + 20,
            left: gutter,
            right: wide ? undefined : gutter,
          },
        ]}
      >
        <Pressable
          onLongPress={onHoldLogo}
          delayLongPress={EXIT_HOLD_MS}
          accessibilityLabel={t('Leave showroom')}
          hitSlop={12}
        >
          <Image
            source={logo}
            resizeMode="contain"
            style={{
              height: logoHeight,
              width: (logoHeight * source.width) / source.height,
            }}
          />
        </Pressable>
        {!wide && slides.length > 1 ? (
          <Counter at={at} count={slides.length} />
        ) : null}
      </View>

      <View
        pointerEvents="box-none"
        style={[
          styles.bottom,
          {
            bottom: insets.bottom + (wide ? 40 : 24),
            left: gutter,
            width: wide ? (column ?? 0) - gutter * 2 : width - gutter * 2,
          },
        ]}
      >
        {slides.length > 1 ? (
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, fill]} />
            </View>
            {wide ? <Counter at={at} count={slides.length} /> : null}
          </View>
        ) : null}
        <KioskButton
          label={touch}
          icon="arrow-forward"
          iconAfter
          variant="solid"
          large
          onPress={() => onExplore(null)}
        />
        {touchHindi ? <Text style={styles.hindi}>{touchHindi}</Text> : null}
      </View>
    </View>
  );
};

const Counter: React.FC<{ at: number; count: number }> = ({ at, count }) => (
  <Text style={styles.counter}>
    {twoDigits(at + 1)}
    <Text style={styles.counterAll}> / {twoDigits(count)}</Text>
  </Text>
);

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: SHOWROOM.ground },
  offer: { flex: 1, justifyContent: 'center' },
  top: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottom: { position: 'absolute', gap: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  track: {
    flex: 1,
    height: 1,
    overflow: 'hidden',
    backgroundColor: SHOWROOM.line,
  },
  fill: {
    height: 1,
    backgroundColor: SHOWROOM.gold,
    transformOrigin: 'left',
  },
  counter: {
    fontFamily: FONT.medium,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.text,
  },
  counterAll: { fontFamily: FONT.regular, color: SHOWROOM.textFaint },
  hindi: {
    fontFamily: FONT.regular,
    fontSize: 13,
    textAlign: 'center',
    color: SHOWROOM.textMuted,
  },
}));
