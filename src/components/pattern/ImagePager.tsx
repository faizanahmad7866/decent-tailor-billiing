import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { patternMediaUri } from '../../storage/patternMediaStore';
import { Tap } from '../Tap';
import { PatternPhoto } from './PatternPhoto';
import { PhotoViewer } from './PhotoViewer';

interface ImagePagerProps {
  /** Photo file names, in the order they are shown. May be empty. */
  images: string[];
  /** The design's name, for the full-screen view. */
  title: string;
  /** No taller than this, so a tablet's width doesn't make a mat a page tall. */
  maxHeight?: number;
}

/** The mat's height against its width: tall, for a garment on a stand. */
const MAT_RATIO = 1.25;
const THUMB_WIDTH = 56;
const THUMB_HEIGHT = 70;

/**
 * The photos of one design, shown the way a menu shows a dish: each whole —
 * never cut off — on a warm mat inside a thin gold frame, one at a time to
 * swipe through, with a small picture of each below to jump to, a count, and
 * a button with a cube on it that opens them on the whole screen to turn and zoom. Without
 * photos it shows the catalogue's empty tile.
 */
export const ImagePager: React.FC<ImagePagerProps> = ({
  images,
  title,
  maxHeight = Infinity,
}) => {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState(false);
  const matHeight = Math.min(width * MAT_RATIO, maxHeight);
  const list = useRef<FlatList<string>>(null);

  const onLayout = (event: LayoutChangeEvent): void =>
    setWidth(event.nativeEvent.layout.width);

  const onScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    if (width > 0) {
      setPage(Math.round(event.nativeEvent.contentOffset.x / width));
    }
  };

  const goTo = (index: number): void => {
    setPage(index);
    list.current?.scrollToIndex({ index, animated: true });
  };

  // Back from the full-screen view on the photo that was last looked at.
  const closeViewer = (index: number): void => {
    setViewing(false);
    if (index !== page && index < images.length) {
      setPage(index);
      requestAnimationFrame(() =>
        list.current?.scrollToIndex({ index, animated: false })
      );
    }
  };

  if (images.length === 0) {
    return (
      <View onLayout={onLayout} style={styles.pager}>
        {width > 0 ? (
          <PatternPhoto name={null} style={{ width, height: matHeight }} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.pager}>
      <View onLayout={onLayout}>
        {width > 0 ? (
          <FlatList
            ref={list}
            data={images}
            keyExtractor={(name) => name}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item }) => (
              <Mat
                name={item}
                width={width}
                height={matHeight}
                onPress={() => setViewing(true)}
              />
            )}
          />
        ) : null}

        {images.length > 1 ? (
          <View pointerEvents="none" style={styles.count}>
            <Text style={styles.countText}>
              {page + 1} / {images.length}
            </Text>
          </View>
        ) : null}

        <Tap
          onPress={() => setViewing(true)}
          accessibilityLabel={t('3D view of the photos')}
          style={styles.fullView}
        >
          <Ionicons name="cube-outline" size={22} color={COLORS.gold} />
        </Tap>
      </View>

      {images.length > 1 ? (
        <View style={styles.thumbs}>
          {images.map((name, index) => (
            <Tap
              key={name}
              onPress={() => goTo(index)}
              haptic="select"
              throttle={false}
              accessibilityLabel={t('Photo {0}', index + 1)}
              accessibilityState={{ selected: index === page }}
              style={[styles.thumb, index === page && styles.thumbActive]}
            >
              <Thumb name={name} />
            </Tap>
          ))}
        </View>
      ) : null}

      <PhotoViewer
        visible={viewing}
        images={images}
        startIndex={page}
        title={title}
        onClose={closeViewer}
      />
    </View>
  );
};

/** One photo on its mat: whole, inside the gold frame; tap to open it. */
const Mat: React.FC<{
  name: string;
  width: number;
  height: number;
  onPress: () => void;
}> = ({ name, width, height, onPress }) => {
  const uri = patternMediaUri(name);
  return (
    <Tap
      onPress={onPress}
      activeOpacity={1}
      accessibilityLabel={t('Open the photo full screen')}
      style={{ width, height }}
    >
      <View style={styles.frame} />
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={styles.photo}
        />
      ) : (
        <PatternPhoto name={null} style={styles.photo} />
      )}
    </Tap>
  );
};

const Thumb: React.FC<{ name: string }> = ({ name }) => {
  const uri = patternMediaUri(name);
  return uri ? (
    <Image
      source={{ uri }}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
      style={StyleSheet.absoluteFill}
    />
  ) : (
    <PatternPhoto name={null} style={StyleSheet.absoluteFill} />
  );
};

const FRAME_INSET = 14;
const PHOTO_INSET = 26;

const styles = themedStyles(() => ({
  pager: { width: '100%', backgroundColor: COLORS.ivory },
  frame: {
    position: 'absolute',
    top: FRAME_INSET,
    left: FRAME_INSET,
    right: FRAME_INSET,
    bottom: FRAME_INSET,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  photo: {
    position: 'absolute',
    top: PHOTO_INSET,
    left: PHOTO_INSET,
    right: PHOTO_INSET,
    bottom: PHOTO_INSET,
  },
  count: {
    position: 'absolute',
    top: 24,
    right: 24,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.ink,
  },
  countText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: COLORS.textOnDark,
  },
  fullView: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.ink,
  },
  thumbs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  thumb: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    overflow: 'hidden',
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.6,
  },
  thumbActive: { borderColor: COLORS.gold, opacity: 1 },
}));
