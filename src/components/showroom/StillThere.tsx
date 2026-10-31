import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { KioskButton } from './KioskButton';
import { showroomType } from './showroomType';

/**
 * Asked when no one has touched the showroom for a while: still looking? The
 * seconds count down, and if no one answers the showroom starts over for the next
 * customer, their picks put away. Any touch answers it.
 */
export const StillThere: React.FC<{
  secondsLeft: number;
  onStay: () => void;
}> = ({ secondsLeft, onStay }) => (
  <Animated.View
    entering={FadeIn.duration(300)}
    exiting={FadeOut.duration(200)}
    style={[StyleSheet.absoluteFill, styles.backdrop]}
  >
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={onStay}
      accessibilityLabel={t('Keep browsing')}
    />
    <Animated.View entering={ZoomIn.duration(320)} style={styles.card}>
      <Text style={[showroomType.display, styles.title]}>
        {t('Still looking?')}
      </Text>
      <Text
        style={[showroomType.figure, styles.count]}
        accessibilityLiveRegion="polite"
      >
        {secondsLeft}
      </Text>
      <Text style={[showroomType.body, styles.text]}>
        {t('The showroom starts over in {0} seconds', secondsLeft)}
      </Text>
      <View style={styles.button}>
        <KioskButton
          label={t('Keep browsing')}
          variant="solid"
          large
          onPress={onStay}
        />
      </View>
    </Animated.View>
  </Animated.View>
);

const styles = themedStyles(() => ({
  backdrop: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: SHOWROOM.backdrop,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 36,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: SHOWROOM.line,
    borderRadius: 2,
    backgroundColor: SHOWROOM.surface,
  },
  title: { fontSize: 34, lineHeight: 40, textAlign: 'center' },
  count: { fontSize: 64, lineHeight: 72, color: SHOWROOM.gold },
  text: { textAlign: 'center' },
  button: { alignSelf: 'stretch', marginTop: 12 },
}));
