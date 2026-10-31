import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ImagePickerAsset } from 'expo-image-picker';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import {
  choosePatternPhoto,
  cropPatternPhoto,
  keepPatternPhoto,
  MAX_VIDEO_MB,
  patternMediaUri,
  pickPatternVideo,
  type PhotoSource,
} from '../../storage/patternMediaStore';
import { MAX_PATTERN_IMAGES } from '../../utils/patternForm';
import type { CropBox } from '../../utils/photoCrop';
import { IconButton } from '../IconButton';
import { Tap } from '../Tap';
import { PatternPhoto } from './PatternPhoto';
import { PhotoCropSheet } from './PhotoCropSheet';

interface PatternMediaFieldProps {
  images: string[];
  videoName: string | null;
  /** A photo was picked and kept. */
  onAddImage: (imageName: string) => void;
  onRemoveImage: (imageName: string) => void;
  /** A photo was cropped: the new file takes the old one's place. */
  onReplaceImage: (oldName: string, newName: string) => void;
  onVideoChange: (videoName: string | null) => void;
}

// The crop sheet: a photo just chosen, not yet kept, or one already on the design.
type Cropping =
  | { kind: 'new'; asset: ImagePickerAsset }
  | { kind: 'kept'; name: string; uri: string };

/**
 * The photos (up to three, the first is the cover) and the one video of a
 * design, picked from the camera or the gallery. A photo goes to the crop sheet as
 * it comes in, cut from its full size, and one already here can be cropped again. All
 * optional: a design saves with what it has.
 */
export const PatternMediaField: React.FC<PatternMediaFieldProps> = ({
  images,
  videoName,
  onAddImage,
  onRemoveImage,
  onReplaceImage,
  onVideoChange,
}) => {
  const [busy, setBusy] = useState(false);
  const [cropping, setCropping] = useState<Cropping | null>(null);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async (source: PhotoSource): Promise<void> => {
    setBusy(true);
    try {
      const result = await choosePatternPhoto(source);
      if (result.status === 'picked') {
        setCropping({ kind: 'new', asset: result.asset });
      } else if (result.status === 'denied') {
        Alert.alert(
          t('Camera not allowed'),
          t(
            'Allow the camera for DT Billing in your phone settings, then try again.'
          ),
          [
            { text: t('Cancel'), style: 'cancel' },
            { text: t('Open settings'), onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch {
      Alert.alert(
        t('Photo not added'),
        t('That photo could not be saved. Try again.')
      );
    } finally {
      setBusy(false);
    }
  };

  const finishCrop = async (box: CropBox | null): Promise<void> => {
    if (!cropping) return;
    setSaving(true);
    try {
      if (cropping.kind === 'new') {
        onAddImage(await keepPatternPhoto(cropping.asset, box));
      } else if (box) {
        onReplaceImage(
          cropping.name,
          await cropPatternPhoto(cropping.name, box)
        );
      }
      setCropping(null);
    } catch {
      Alert.alert(
        t('Photo not added'),
        t('That photo could not be saved. Try again.')
      );
    } finally {
      setSaving(false);
    }
  };

  const cropKept = (name: string): void => {
    const uri = patternMediaUri(name);
    if (uri) setCropping({ kind: 'kept', name, uri });
  };

  const addPhoto = (): void =>
    Alert.alert(t('Add a photo'), undefined, [
      { text: t('Camera'), onPress: () => void pickPhoto('camera') },
      { text: t('Gallery'), onPress: () => void pickPhoto('gallery') },
      { text: t('Cancel'), style: 'cancel' },
    ]);

  const pickVideo = async (): Promise<void> => {
    setBusy(true);
    try {
      const result = await pickPatternVideo();
      if (result.status === 'picked') onVideoChange(result.videoName);
      else if (result.status === 'tooLarge') {
        Alert.alert(
          t('Video too large'),
          t('Choose a shorter video, under {0} MB.', MAX_VIDEO_MB)
        );
      }
    } catch {
      Alert.alert(
        t('Video not added'),
        t('That video could not be saved. Try again.')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.field}>
      <View>
        <Text style={styles.label}>
          {t('Photos · फोटो (up to {0})', MAX_PATTERN_IMAGES)}
        </Text>
        <View style={styles.slots}>
          {Array.from({ length: MAX_PATTERN_IMAGES }, (_, index) => {
            const image = images[index];
            if (image) {
              return (
                <View key={image} style={styles.slot}>
                  <PatternPhoto name={image} style={StyleSheet.absoluteFill} />
                  {index === 0 ? (
                    <View style={styles.cover}>
                      <Text style={styles.coverText}>{t('Cover')}</Text>
                    </View>
                  ) : null}
                  <View style={styles.remove}>
                    <IconButton
                      icon="close"
                      label={t('Remove photo')}
                      color={COLORS.textOnDark}
                      onPress={() => onRemoveImage(image)}
                      disabled={busy}
                    />
                  </View>
                  <View style={styles.crop}>
                    <IconButton
                      icon="crop"
                      label={t('Crop photo')}
                      color={COLORS.textOnDark}
                      onPress={() => cropKept(image)}
                      disabled={busy}
                    />
                  </View>
                </View>
              );
            }
            const next = index === images.length;
            return (
              <Tap
                key={`empty-${index}`}
                onPress={addPhoto}
                disabled={!next || busy}
                accessibilityLabel={t('Add a photo')}
                style={[styles.slot, styles.empty, !next && styles.ghost]}
              >
                {busy && next ? (
                  <ActivityIndicator color={COLORS.accent} />
                ) : (
                  <Ionicons name="add" size={30} color={COLORS.accent} />
                )}
              </Tap>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={styles.label}>
          {t('Video · वीडियो (one, under {0} MB)', MAX_VIDEO_MB)}
        </Text>
        {videoName ? (
          <View style={styles.video}>
            <Ionicons name="play-circle" size={36} color={COLORS.gold} />
            <Text style={styles.videoText}>{t('Video added')}</Text>
            <IconButton
              icon="swap-horizontal"
              label={t('Replace the video')}
              color={COLORS.textOnDark}
              onPress={() => void pickVideo()}
              disabled={busy}
            />
            <IconButton
              icon="close"
              label={t('Remove the video')}
              color={COLORS.textOnDark}
              onPress={() => onVideoChange(null)}
              disabled={busy}
            />
          </View>
        ) : (
          <Tap
            onPress={() => void pickVideo()}
            disabled={busy}
            accessibilityLabel={t('Add a video')}
            style={styles.addVideo}
          >
            {busy ? (
              <ActivityIndicator color={COLORS.accent} />
            ) : (
              <Ionicons
                name="videocam-outline"
                size={24}
                color={COLORS.accent}
              />
            )}
            <Text style={styles.addVideoText}>
              {t('Add a video from the gallery')}
            </Text>
          </Tap>
        )}
      </View>

      <PhotoCropSheet
        uri={
          cropping
            ? cropping.kind === 'new'
              ? cropping.asset.uri
              : cropping.uri
            : null
        }
        busy={saving}
        onDone={(box) => void finishCrop(box)}
        onCancel={() => setCropping(null)}
      />
    </View>
  );
};

const styles = themedStyles(() => ({
  field: { gap: 18 },
  label: { ...TYPE.label, color: COLORS.textPrimary, marginBottom: 6 },
  slots: { flexDirection: 'row', gap: 10 },
  slot: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryTintStrong,
    backgroundColor: COLORS.primaryTint,
  },
  ghost: { opacity: 0.4 },
  cover: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.gold,
  },
  coverText: { ...TYPE.caption, color: COLORS.ink },
  remove: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: 24,
    backgroundColor: COLORS.scrim,
    transform: [{ scale: 0.75 }],
  },
  crop: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: COLORS.scrim,
    transform: [{ scale: 0.75 }],
  },
  video: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 4,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink,
  },
  videoText: { ...TYPE.bodyStrong, flex: 1, color: COLORS.textOnDark },
  addVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryTintStrong,
    backgroundColor: COLORS.primaryTint,
  },
  addVideoText: { ...TYPE.bodyStrong, color: COLORS.accent },
}));
