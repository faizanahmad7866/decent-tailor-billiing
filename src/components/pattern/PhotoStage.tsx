import React, { useEffect, useMemo, useRef } from 'react';
import { Image, PanResponder, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { COLORS, RADIUS } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { patternMediaUri } from '../../storage/patternMediaStore';
import {
  photoAt,
  placeFromFront,
  poseAt,
  settleOn,
  tipFor,
  turnFor,
} from '../../utils/photoStage';
import { PatternPhoto } from './PatternPhoto';

interface PhotoStageProps {
  /** Photo file names, in the order they are shown. */
  images: string[];
  /** The photo to open on. */
  startIndex: number;
  width: number;
  height: number;
  /** The photo in front has changed. */
  onChange: (index: number) => void;
  /** A tap, rather than a drag. */
  onTap: () => void;
}

const SETTLE = {
  damping: 20,
  stiffness: 170,
  mass: 0.9,
  reduceMotion: ReduceMotion.System,
};
// How far the front photo sways by itself while it is left alone, showing at a
// glance that it can be turned.
const SWAY_DEGREES = 7;
const SWAY_MS = 2600;
// How far the finger may wander and still be a tap.
const TAP_SLOP = 8;

/**
 * The design's photos standing on a 3D stage: the front one facing the customer
 * and the others turned in beside it, in a ring. A finger turns the stage from
 * one to the next and tips the photo towards or away; a lone photo turns on the
 * spot and comes back. The photos are flat — this shows them in depth, it does
 * not invent the side of a garment that was never photographed.
 */
export const PhotoStage: React.FC<PhotoStageProps> = ({
  images,
  startIndex,
  width,
  height,
  onChange,
  onTap,
}) => {
  const count = images.length;
  // Tall like a garment on a stand, and leaving the neighbours room to show.
  const cardWidth = Math.min(width * 0.72, height * 0.68);
  const cardHeight = Math.min(height * 0.88, cardWidth * 1.3);

  const progress = useSharedValue(startIndex);
  const turn = useSharedValue(0);
  const tip = useSharedValue(0);
  const sway = useSharedValue(0);
  // Where the stage settled last, which can run past the count going round.
  const settled = useRef(startIndex);

  const startSway = (): void => {
    sway.value = withRepeat(
      withSequence(
        withTiming(SWAY_DEGREES, {
          duration: SWAY_MS,
          easing: Easing.inOut(Easing.sin),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(-SWAY_DEGREES, {
          duration: SWAY_MS,
          easing: Easing.inOut(Easing.sin),
          reduceMotion: ReduceMotion.System,
        })
      ),
      -1,
      true
    );
  };

  useEffect(() => {
    startSway();
    return () => cancelAnimation(sway);
    // Only while the stage is up: the shared value itself never changes.
  }, []);

  // Opened again on another photo: the stage stands facing that one at once.
  useEffect(() => {
    if (photoAt(settled.current, count) === startIndex) return;
    settled.current = startIndex;
    progress.value = startIndex;
  }, [startIndex, count, progress]);

  // Kept in a ref for the responder, which is made once and reads the latest.
  const latest = useRef({ count, width, height, cardWidth, onChange, onTap });
  latest.current = { count, width, height, cardWidth, onChange, onTap };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // The viewer stands inside the design page's scroll view, which would
        // otherwise take the gesture the moment a finger moved up or down.
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          cancelAnimation(sway);
          sway.value = withTiming(0, { duration: 120 });
        },
        onPanResponderMove: (_, { dx, dy }) => {
          const now = latest.current;
          tip.value = tipFor(dy, now.height);
          if (now.count > 1) {
            progress.value = settled.current - dx / (now.cardWidth * 0.8);
          } else {
            turn.value = turnFor(dx, now.width);
          }
        },
        onPanResponderRelease: (_, { dx, dy, vx }) => {
          const now = latest.current;
          if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) now.onTap();
          const next = settleOn(
            settled.current,
            dx,
            vx,
            now.cardWidth,
            now.count
          );
          settled.current = next;
          progress.value = withSpring(next, SETTLE);
          turn.value = withSpring(0, SETTLE);
          tip.value = withSpring(0, SETTLE);
          now.onChange(photoAt(next, now.count));
          startSway();
        },
        onPanResponderTerminate: () => {
          progress.value = withSpring(settled.current, SETTLE);
          turn.value = withSpring(0, SETTLE);
          tip.value = withSpring(0, SETTLE);
          startSway();
        },
      }),
    // The shared values never change; everything else is read from `latest`.
    []
  );

  return (
    <View {...responder.panHandlers} style={[styles.stage, { width, height }]}>
      {images.map((name, index) => (
        <StageCard
          key={name}
          name={name}
          index={index}
          count={count}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          progress={progress}
          turn={turn}
          tip={tip}
          sway={sway}
        />
      ))}
    </View>
  );
};

const StageCard: React.FC<{
  name: string;
  index: number;
  count: number;
  cardWidth: number;
  cardHeight: number;
  progress: SharedValue<number>;
  turn: SharedValue<number>;
  tip: SharedValue<number>;
  sway: SharedValue<number>;
}> = ({
  name,
  index,
  count,
  cardWidth,
  cardHeight,
  progress,
  turn,
  tip,
  sway,
}) => {
  const uri = patternMediaUri(name);

  const pose = useAnimatedStyle(() => {
    const place = placeFromFront(index, progress.value, count);
    const { translateX, rotateY, scale, opacity, zIndex } = poseAt(
      place,
      cardWidth
    );
    // Only the photo in front answers the finger and sways.
    const front = Math.max(1 - Math.abs(place), 0);
    return {
      opacity,
      zIndex,
      transform: [
        { perspective: 1100 },
        { translateX },
        { rotateY: `${rotateY + (turn.value + sway.value) * front}deg` },
        { rotateX: `${tip.value * front}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.card, { width: cardWidth, height: cardHeight }, pose]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={styles.photo}
        />
      ) : (
        <PatternPhoto name={null} style={StyleSheet.absoluteFill} />
      )}
    </Animated.View>
  );
};

const styles = themedStyles(() => ({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  photo: { flex: 1, margin: 10 },
}));
