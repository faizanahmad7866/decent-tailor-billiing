import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { patternMediaUri } from '../../storage/patternMediaStore';
import { IconButton } from '../IconButton';
import { PatternPhoto } from './PatternPhoto';
import { PhotoStage } from './PhotoStage';
import { Tap } from '../Tap';

interface PhotoViewerProps {
  visible: boolean;
  /** Photo file names, in the order they are shown. */
  images: string[];
  /** The photo to open on. */
  startIndex: number;
  /** The design's name, shown at the top. */
  title: string;
  /** The colour behind the photos, where it is not the app's own dark. */
  ground?: string;
  /** Called with the photo being looked at when the viewer is closed. */
  onClose: (index: number) => void;
}

/** How much larger than the screen a photo is when zoomed in. */
const ZOOM = 2.5;
/** Two taps this close together are a double tap. */
const DOUBLE_TAP_MS = 300;

interface Area {
  width: number;
  height: number;
}

/**
 * A design's photos full screen, on a dark ground, in 3D: they stand on a stage
 * that a finger turns from one to the next (see PhotoStage). To look closely at
 * the cloth and the work, the Zoom button or a double tap brings the front photo
 * flat and large, to drag around. The whole photo is shown, never cut off.
 */
export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  visible,
  images,
  startIndex,
  title,
  ground,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState<Area>({ width: 0, height: 0 });
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const lastTap = useRef(0);

  // Opens on the photo that was showing, every time.
  useEffect(() => {
    if (visible) setIndex(startIndex);
  }, [visible, startIndex]);

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setArea({ width, height });
  };

  const onTap = (): void => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      setZoomed((on) => !on);
    } else {
      lastTap.current = now;
    }
  };

  const close = (): void => {
    setZoomed(false);
    onClose(index);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View
        style={[
          styles.page,
          ground ? { backgroundColor: ground } : null,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.top}>
          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {images.length > 1 ? (
              <Text style={styles.counter}>
                {index + 1} / {images.length}
              </Text>
            ) : null}
          </View>
          <IconButton
            icon="close"
            label={t('Close')}
            color={COLORS.textOnDark}
            onPress={close}
          />
        </View>

        <View onLayout={onLayout} style={styles.area}>
          {area.width > 0 && visible ? (
            zoomed ? (
              <ViewerPage
                name={images[index]}
                area={area}
                zoomed
                onTap={onTap}
              />
            ) : (
              <PhotoStage
                images={images}
                startIndex={index}
                width={area.width}
                height={area.height}
                onChange={setIndex}
                onTap={onTap}
              />
            )
          ) : null}
        </View>

        <View style={styles.bottom}>
          <Text style={styles.hint}>
            {zoomed
              ? t('Drag to look around')
              : images.length > 1
                ? t('Drag to turn · घुमाने के लिए खींचें')
                : t('Drag to tilt · घुमाने के लिए खींचें')}
          </Text>
          <Tap
            onPress={() => setZoomed((now) => !now)}
            accessibilityLabel={zoomed ? t('Zoom out') : t('Zoom in')}
            style={styles.zoom}
          >
            <Ionicons
              name={zoomed ? 'remove' : 'add'}
              size={20}
              color={COLORS.onPrimary}
            />
            <Text style={styles.zoomLabel}>
              {zoomed ? t('Zoom out') : t('Zoom in')}
            </Text>
          </Tap>
        </View>
      </View>
    </Modal>
  );
};

interface ViewerPageProps {
  name: string;
  area: Area;
  zoomed: boolean;
  onTap: () => void;
}

/** One photo in the viewer: whole on the screen, or zoomed to look around. */
const ViewerPage: React.FC<ViewerPageProps> = ({
  name,
  area,
  zoomed,
  onTap,
}) => {
  const uri = patternMediaUri(name);
  if (!uri) {
    return <PatternPhoto name={null} style={area} />;
  }

  if (!zoomed) {
    return (
      <Pressable onPress={onTap} style={area}>
        <Image
          source={{ uri }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={area}
        />
      </Pressable>
    );
  }

  // Zoomed: the photo is larger than the screen, and drags both ways — a
  // vertical scroll holding a horizontal one, since neither alone does both.
  const width = area.width * ZOOM;
  const height = area.height * ZOOM;
  return (
    <ScrollView
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      contentOffset={{ x: 0, y: (height - area.height) / 2 }}
      style={area}
    >
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: (width - area.width) / 2, y: 0 }}
        style={{ width: area.width, height }}
      >
        <Pressable onPress={onTap} style={{ width, height }}>
          <Image
            source={{ uri }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            style={{ width, height }}
          />
        </Pressable>
      </ScrollView>
    </ScrollView>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.ink },
  top: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
  },
  titleBlock: { flex: 1, gap: 1 },
  title: {
    fontFamily: FONT.bold,
    fontSize: 17,
    color: COLORS.textOnDark,
  },
  counter: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: COLORS.textOnDarkMuted,
  },
  area: { flex: 1, overflow: 'hidden' },
  bottom: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  hint: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: COLORS.textOnDarkMuted,
  },
  zoom: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 14,
    paddingRight: 18,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
  },
  zoomLabel: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    color: COLORS.onPrimary,
  },
}));
