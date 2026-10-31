import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';

export type IconName = keyof typeof Ionicons.glyphMap;

const PILL_SPRING = {
  damping: 16,
  stiffness: 260,
  mass: 0.7,
  reduceMotion: ReduceMotion.System,
};

/**
 * A tab's icon, in the bottom bar or the rail. The selected one's pill grows
 * out from behind it rather than blinking on, so switching tabs reads as a
 * response to the finger.
 */
export const TabIcon: React.FC<{
  focused: boolean;
  name: IconName;
  color: string;
}> = ({ focused, name, color }) => {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, PILL_SPRING);
  }, [focused, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(progress.value, 0), 1),
    transform: [{ scaleX: 0.55 + 0.45 * progress.value }],
  }));

  return (
    <View style={styles.icon}>
      <Animated.View style={[styles.pill, pillStyle]} />
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
};

const styles = themedStyles(() => ({
  icon: {
    width: 56,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryTint,
  },
}));
