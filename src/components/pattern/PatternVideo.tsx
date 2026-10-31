import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { patternMediaUri } from '../../storage/patternMediaStore';

interface PatternVideoProps {
  /** The video's file name. */
  name: string;
}

/**
 * A design's video, played in place with the phone's own controls (play,
 * seek, full screen). If the file is gone, say so rather than show a black box.
 */
export const PatternVideo: React.FC<PatternVideoProps> = ({ name }) => {
  const uri = patternMediaUri(name);
  const player = useVideoPlayer(uri, (video) => {
    video.loop = false;
  });

  if (!uri) {
    return (
      <View style={[styles.frame, styles.missing]}>
        <Text style={styles.missingText}>
          {t('This video is no longer on the phone.')}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.frame}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
};

const styles = themedStyles(() => ({
  frame: {
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.ink,
  },
  missing: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  missingText: {
    ...TYPE.body,
    textAlign: 'center',
    color: COLORS.textOnDarkMuted,
  },
}));
