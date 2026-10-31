import React, { useEffect, useRef } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { Tap } from '../Tap';

/**
 * Keeps a design in the customer's picks, or takes it out. The heart fills in the
 * logo's gold and gives one small beat as it does, so keeping a design is felt.
 */
export const HeartButton: React.FC<{
  picked: boolean;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ picked, onPress, size = 40, style }) => {
  const beat = useSharedValue(1);
  const was = useRef(picked);

  useEffect(() => {
    if (picked && !was.current) {
      beat.value = withSequence(
        withTiming(1.22, { duration: 120, reduceMotion: ReduceMotion.System }),
        withSpring(1, {
          damping: 9,
          stiffness: 260,
          reduceMotion: ReduceMotion.System,
        })
      );
    }
    was.current = picked;
  }, [picked, beat]);

  const icon = useAnimatedStyle(() => ({
    transform: [{ scale: beat.value }],
  }));

  return (
    <Tap
      onPress={onPress}
      haptic="select"
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: picked }}
      accessibilityLabel={
        picked ? t('Remove from my picks') : t('Add to my picks')
      }
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Animated.View style={icon}>
        <Ionicons
          name={picked ? 'heart' : 'heart-outline'}
          size={Math.round(size * 0.5)}
          color={picked ? SHOWROOM.gold : SHOWROOM.text}
        />
      </Animated.View>
    </Tap>
  );
};

const styles = themedStyles(() => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SHOWROOM.scrim,
  },
}));
