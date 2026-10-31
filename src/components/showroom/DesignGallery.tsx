import React, { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { Tap } from '../Tap';
import { Mat, MatLayer, MatPhoto } from './MatPhoto';

const THUMB_WIDTH = 56;
const THUMB_HEIGHT = 70;

interface DesignGalleryProps {
  images: string[];
  width: number;
  height: number;
  /** A photo tapped, or the 3D button: the photos in 3D, from that one. */
  onOpen3D: (index: number) => void;
  /** Room at the sides of the small photos, where the large ones go edge to edge. */
  inset?: number;
}

/**
 * A design's photos, large on their mats, one at a time to swipe through, with a
 * small one of each below to jump to. A tap, or the button on the photo, stands
 * them up in 3D.
 */
export const DesignGallery: React.FC<DesignGalleryProps> = ({
  images,
  width,
  height,
  onOpen3D,
  inset = 0,
}) => {
  const pager = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

  const onSettled = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.min(Math.max(page, 0), images.length - 1));
  };

  const jump = (to: number): void => {
    setIndex(to);
    pager.current?.scrollTo({ x: to * width, animated: true });
  };

  return (
    <View style={styles.gallery}>
      <View style={{ width, height }}>
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onSettled}
          scrollEnabled={many}
        >
          {images.length ? (
            images.map((name, at) => (
              <Pressable
                key={name}
                onPress={() => onOpen3D(at)}
                accessibilityRole="imagebutton"
                accessibilityLabel={t('See in 3D')}
              >
                <MatPhoto
                  name={name}
                  inset={Math.round(Math.min(width, height) * 0.06)}
                  style={{ width, height }}
                />
              </Pressable>
            ))
          ) : (
            <MatPhoto name={null} style={{ width, height }} />
          )}
        </ScrollView>
        {many ? (
          <Text style={styles.counter}>
            {index + 1} / {images.length}
          </Text>
        ) : null}
        {images.length ? (
          <Tap
            onPress={() => onOpen3D(index)}
            accessibilityLabel={t('See in 3D')}
            style={styles.view3d}
          >
            <Ionicons name="cube-outline" size={17} color={SHOWROOM.text} />
            <Text style={styles.view3dText}>{t('See in 3D')}</Text>
          </Tap>
        ) : null}
      </View>
      {many ? (
        <View style={[styles.thumbs, { paddingHorizontal: inset }]}>
          {images.map((name, at) => (
            <Tap
              key={name}
              onPress={() => jump(at)}
              haptic="select"
              throttle={false}
              accessibilityLabel={t('Photo {0} of {1}', at + 1, images.length)}
              accessibilityState={{ selected: at === index }}
              style={[styles.thumb, at === index && styles.thumbSelected]}
            >
              <Mat style={styles.thumbMat}>
                <MatLayer name={name} inset={4} small />
              </Mat>
            </Tap>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = themedStyles(() => ({
  gallery: { gap: 14 },
  counter: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    height: 26,
    lineHeight: 26,
    borderRadius: 13,
    overflow: 'hidden',
    fontFamily: FONT.medium,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.text,
    backgroundColor: SHOWROOM.scrim,
  },
  view3d: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: SHOWROOM.scrim,
  },
  view3dText: { fontFamily: FONT.medium, fontSize: 13, color: SHOWROOM.text },
  thumbs: { flexDirection: 'row', gap: 10 },
  thumb: {
    padding: 2,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 2,
  },
  thumbSelected: { borderColor: SHOWROOM.gold },
  thumbMat: { width: THUMB_WIDTH, height: THUMB_HEIGHT },
}));
