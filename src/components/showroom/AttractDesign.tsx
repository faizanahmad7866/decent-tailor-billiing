import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { shownCategory } from '../../i18n/names';
import type { ShowroomDesign } from '../../repositories/patternRepo';
import { designHindi } from '../../utils/designHindi';
import { formatRupees } from '../../utils/money';
import {
  designNameSize,
  photoFadeStarts,
  SHOWROOM_PHOTOS_SHOWN,
} from '../../utils/showroom';
import { Eyebrow } from './Eyebrow';
import { Mat, MatLayer } from './MatPhoto';
import { Reveal } from './Reveal';
import { showroomType } from './showroomType';

const BUILD_MS = 1400;
const PHOTO_FADE_MS = 1100;
// How much closer the photo comes while it is on show: enough to feel alive, too
// little to notice as a zoom.
const DRIFT = 1.04;

/** The room a slide leaves for what stands over it: the logo, the button. */
export interface AttractFrame {
  /** Above and below the slide: clear of the logo and the button. */
  top: number;
  bottom: number;
  /**
   * On a screen on its side, the words stand in a column at the left, clear of
   * the logo and the button, and the photo takes the rest, nearer the edges.
   */
  column: number | null;
  photoTop: number;
  photoBottom: number;
  gutter: number;
}

interface AttractDesignProps {
  design: ShowroomDesign;
  slideMs: number;
  width: number;
  frame: AttractFrame;
  showPrice: boolean;
  onOpen: () => void;
}

const FadingLayer: React.FC<{
  name: string;
  turn: number;
  shown: SharedValue<number>;
  drift: SharedValue<number>;
  inset: number;
}> = ({ name, turn, shown, drift, inset }) => {
  const style = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(shown.value - turn)),
    transform: [{ scale: drift.value }],
  }));
  return <MatLayer name={name} inset={inset} style={style} />;
};

/**
 * A design in the attract loop: its photo large on the mat, slowly coming closer
 * and fading through up to three of its photos, and its name set beneath it — or
 * beside it, on a screen on its side — line by line. A touch opens it.
 */
export const AttractDesign: React.FC<AttractDesignProps> = ({
  design,
  slideMs,
  width,
  frame,
  showPrice,
  onOpen,
}) => {
  const build = useSharedValue(0);
  const drift = useSharedValue(1);
  const shown = useSharedValue(0);
  const photos = design.images.slice(0, SHOWROOM_PHOTOS_SHOWN);

  useEffect(() => {
    build.value = withDelay(
      200,
      withTiming(1, {
        duration: BUILD_MS,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      })
    );
    drift.value = withTiming(DRIFT, {
      duration: slideMs + 1200,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.System,
    });
    const fades = photoFadeStarts(slideMs, photos.length, PHOTO_FADE_MS).map(
      (startMs, turn) =>
        setTimeout(() => {
          shown.value = withTiming(turn + 1, {
            duration: PHOTO_FADE_MS,
            easing: Easing.inOut(Easing.quad),
          });
        }, startMs)
    );
    return () => {
      fades.forEach(clearTimeout);
      cancelAnimation(drift);
    };
  }, [build, drift, shown, slideMs, photos.length]);

  const wide = frame.column !== null;
  const hindi = designHindi(design.name);
  const nameSize = designNameSize(design.name, wide);
  const priced = showPrice && design.pricePaise > 0;
  const inset = Math.round((wide ? width - (frame.column ?? 0) : width) * 0.05);

  const words = (
    <View style={wide ? styles.wordsWide : styles.words}>
      <Reveal build={build} from={0} to={0.4} rise={8}>
        <Eyebrow>{shownCategory(design.categoryName)}</Eyebrow>
      </Reveal>
      <Reveal build={build} from={0.1} to={0.6} rise={16}>
        <Text
          numberOfLines={3}
          style={[
            showroomType.display,
            { fontSize: nameSize, lineHeight: Math.round(nameSize * 1.08) },
          ]}
        >
          {design.name}
        </Text>
      </Reveal>
      {hindi ? (
        <Reveal build={build} from={0.25} to={0.75} rise={8}>
          <Text
            numberOfLines={2}
            style={[showroomType.hindi, wide && styles.hindiWide]}
          >
            {hindi}
          </Text>
        </Reveal>
      ) : null}
      {priced ? (
        <Reveal build={build} from={0.4} to={0.95} rise={8}>
          <Text
            style={[
              showroomType.figure,
              styles.price,
              wide && styles.priceWide,
            ]}
          >
            {formatRupees(design.pricePaise)}
          </Text>
        </Reveal>
      ) : null}
    </View>
  );

  const mat = (
    <Mat style={wide ? styles.matWide : styles.mat}>
      {photos.map((name, turn) => (
        <FadingLayer
          key={name}
          name={name}
          turn={turn}
          shown={shown}
          drift={drift}
          inset={inset}
        />
      ))}
    </Mat>
  );

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={design.name}
      style={[
        StyleSheet.absoluteFill,
        wide
          ? styles.row
          : [
              styles.column,
              {
                paddingTop: frame.top,
                paddingBottom: frame.bottom,
                paddingHorizontal: frame.gutter,
              },
            ],
      ]}
    >
      {wide ? (
        <>
          <View
            style={[
              styles.side,
              {
                width: frame.column ?? 0,
                paddingTop: frame.top,
                paddingBottom: frame.bottom,
                paddingHorizontal: frame.gutter,
              },
            ]}
          >
            {words}
          </View>
          <View
            style={[
              styles.matSide,
              {
                paddingTop: frame.photoTop,
                paddingBottom: frame.photoBottom,
                paddingRight: frame.photoBottom,
              },
            ]}
          >
            {mat}
          </View>
        </>
      ) : (
        <>
          {mat}
          {words}
        </>
      )}
    </Pressable>
  );
};

const styles = themedStyles(() => ({
  column: { flexDirection: 'column' },
  row: { flexDirection: 'row' },
  mat: { flex: 1 },
  matWide: { flex: 1 },
  matSide: { flex: 1 },
  side: { justifyContent: 'center' },
  words: { paddingTop: 24, gap: 8 },
  wordsWide: { gap: 12 },
  hindiWide: { fontSize: 17 },
  price: { fontSize: 28, marginTop: 6, color: SHOWROOM.gold },
  priceWide: { fontSize: 36, marginTop: 10 },
}));
