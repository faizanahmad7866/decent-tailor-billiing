import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import {
  cropGrabAt,
  dragCrop,
  fitPhoto,
  isWholePhoto,
  WHOLE_PHOTO,
  type CropBox,
  type CropGrab,
} from '../../utils/photoCrop';
import { Button } from '../Button';

// How far from a side a thumb still has hold of it, in pixels.
const REACH = 26;
const CORNER = 26;
const CORNER_WEIGHT = 4;

interface PhotoCropSheetProps {
  /** The photo to crop; null keeps the sheet closed. */
  uri: string | null;
  /** Saving what was chosen. */
  busy: boolean;
  /** The part to keep, or null for the whole photo. */
  onDone: (box: CropBox | null) => void;
  onCancel: () => void;
}

const CORNERS = [
  { key: 'nw', top: true, left: true },
  { key: 'ne', top: true, left: false },
  { key: 'sw', top: false, left: true },
  { key: 'se', top: false, left: false },
];

/**
 * Chooses the part of a photo to keep: a box over it, whose corners and sides a finger
 * pulls to any shape, and which moves when dragged from inside. What falls outside is
 * dimmed, so it shows what will go.
 */
export const PhotoCropSheet: React.FC<PhotoCropSheetProps> = ({
  uri,
  busy,
  onDone,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [image, setImage] = useState<{ width: number; height: number } | null>(
    null
  );
  const [box, setBox] = useState<CropBox>(WHOLE_PHOTO);

  useEffect(() => {
    setBox(WHOLE_PHOTO);
    setImage(null);
    if (!uri) return;
    let active = true;
    Image.getSize(
      uri,
      (width, height) => {
        if (active) setImage({ width, height });
      },
      () => {
        if (!active) return;
        Alert.alert(
          t('Photo not added'),
          t('That file could not be opened. Try again.')
        );
        onCancel();
      }
    );
    return () => {
      active = false;
    };
    // A new photo is what starts this afresh, not a new onCancel.
  }, [uri]);

  const shown = useMemo(
    () =>
      image && area.width > 0
        ? fitPhoto(area.width, area.height, image.width, image.height)
        : null,
    [area, image]
  );

  // What the responder reads when a finger moves: it is made once, so it cannot close
  // over the state directly.
  const live = useRef({ box, shown });
  live.current = { box, shown };
  const hold = useRef<{ grab: CropGrab; start: CropBox } | null>(null);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          const { box: now, shown: photo } = live.current;
          if (!photo) return;
          const { locationX, locationY } = event.nativeEvent;
          const grab = cropGrabAt(
            now,
            photo.width,
            photo.height,
            locationX,
            locationY,
            REACH
          );
          hold.current = grab ? { grab, start: now } : null;
        },
        onPanResponderMove: (_, gesture) => {
          const { shown: photo } = live.current;
          if (!hold.current || !photo) return;
          setBox(
            dragCrop(
              hold.current.start,
              hold.current.grab,
              gesture.dx / photo.width,
              gesture.dy / photo.height
            )
          );
        },
        onPanResponderRelease: () => {
          hold.current = null;
        },
      }),
    []
  );

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setArea({ width, height });
  };

  const whole = isWholePhoto(box);
  const px = shown
    ? {
        left: box.x * shown.width,
        top: box.y * shown.height,
        width: box.width * shown.width,
        height: box.height * shown.height,
      }
    : null;

  return (
    <Modal
      visible={uri !== null}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View
        style={[
          styles.page,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.head}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('Crop photo')}
          </Text>
          <Text style={styles.hint}>
            {t('Pull the corners to choose the part to keep, or drag the box')}
          </Text>
        </View>

        <View onLayout={onLayout} style={styles.area}>
          {uri && shown && px ? (
            <View
              {...responder.panHandlers}
              style={{
                position: 'absolute',
                left: shown.x,
                top: shown.y,
                width: shown.width,
                height: shown.height,
              }}
            >
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Image
                  source={{ uri }}
                  resizeMode="stretch"
                  style={StyleSheet.absoluteFill}
                />

                <View
                  style={[
                    styles.dim,
                    { left: 0, right: 0, top: 0, height: px.top },
                  ]}
                />
                <View
                  style={[
                    styles.dim,
                    { left: 0, right: 0, top: px.top + px.height, bottom: 0 },
                  ]}
                />
                <View
                  style={[
                    styles.dim,
                    { left: 0, width: px.left, top: px.top, height: px.height },
                  ]}
                />
                <View
                  style={[
                    styles.dim,
                    {
                      left: px.left + px.width,
                      right: 0,
                      top: px.top,
                      height: px.height,
                    },
                  ]}
                />

                <View style={[styles.box, px]}>
                  {/* Thirds, to line the design up by eye. */}
                  <View style={[styles.lineDown, { left: '33.33%' }]} />
                  <View style={[styles.lineDown, { left: '66.66%' }]} />
                  <View style={[styles.lineAcross, { top: '33.33%' }]} />
                  <View style={[styles.lineAcross, { top: '66.66%' }]} />
                  {CORNERS.map(({ key, top, left }) => (
                    <View
                      key={key}
                      style={[
                        styles.corner,
                        top ? styles.cornerTop : styles.cornerBottom,
                        left ? styles.cornerLeft : styles.cornerRight,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <View style={styles.row}>
            <View style={styles.half}>
              <Button
                label={t('Cancel')}
                variant="secondary"
                disabled={busy}
                onPress={onCancel}
              />
            </View>
            <View style={styles.half}>
              <Button
                label={t('Whole photo')}
                icon="scan-outline"
                variant="secondary"
                disabled={busy || whole}
                onPress={() => setBox(WHOLE_PHOTO)}
              />
            </View>
          </View>
          <Button
            label={whole ? t('Use whole photo') : t('Keep this part')}
            icon="checkmark"
            loading={busy}
            disabled={!shown}
            onPress={() => onDone(whole ? null : box)}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, gap: 14, backgroundColor: COLORS.ink },
  head: { paddingHorizontal: 20, gap: 2 },
  title: { ...TYPE.title, color: COLORS.textOnDark },
  hint: { ...TYPE.caption, color: COLORS.textOnDarkMuted },
  // Room around the photo, so a corner at its very edge can still be reached.
  area: { flex: 1, marginHorizontal: 22, marginVertical: 8 },
  dim: { position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.62)' },
  box: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLORS.textOnDark,
  },
  lineDown: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.textOnDarkMuted,
  },
  lineAcross: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.textOnDarkMuted,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: COLORS.primary,
  },
  cornerTop: {
    top: -CORNER_WEIGHT,
    borderTopWidth: CORNER_WEIGHT,
  },
  cornerBottom: {
    bottom: -CORNER_WEIGHT,
    borderBottomWidth: CORNER_WEIGHT,
  },
  cornerLeft: {
    left: -CORNER_WEIGHT,
    borderLeftWidth: CORNER_WEIGHT,
  },
  cornerRight: {
    right: -CORNER_WEIGHT,
    borderRightWidth: CORNER_WEIGHT,
  },
  actions: { paddingHorizontal: 20, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
}));
