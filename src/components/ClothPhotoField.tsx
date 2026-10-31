import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import {
  clothPhotoUri,
  pickClothPhoto,
  type PhotoSource,
} from '../storage/clothImageStore';
import { Button } from './Button';
import { IconButton } from './IconButton';

interface ClothPhotoFieldProps {
  imageName: string | null;
  onChange: (imageName: string | null) => void;
}

/**
 * The cloth's photo: a large preview, and Camera / Gallery to take or replace
 * it. Optional — a cloth saves fine without one.
 */
export const ClothPhotoField: React.FC<ClothPhotoFieldProps> = ({
  imageName,
  onChange,
}) => {
  const [busy, setBusy] = useState(false);
  const uri = imageName ? clothPhotoUri(imageName) : null;

  const handlePick = async (source: PhotoSource): Promise<void> => {
    setBusy(true);
    try {
      const result = await pickClothPhoto(source);
      if (result.status === 'picked') {
        onChange(result.imageName);
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

  return (
    <View>
      <Text style={styles.label}>{t('Cloth photo (optional)')}</Text>
      <View style={styles.preview}>
        {uri ? (
          <>
            <Image
              source={{ uri }}
              resizeMode="cover"
              accessibilityLabel={t('Cloth photo')}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.remove}>
              <IconButton
                icon="close"
                label={t('Remove photo')}
                color={COLORS.textOnDark}
                onPress={() => onChange(null)}
                disabled={busy}
              />
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={34} color={COLORS.accent} />
            <Text style={styles.placeholderTitle}>
              {t('Add a photo of the cloth')}
            </Text>
            <Text style={styles.placeholderHint}>
              {t('You can skip this — the cloth saves without a photo')}
            </Text>
          </View>
        )}
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={COLORS.accent} size="large" />
          </View>
        ) : null}
      </View>

      <View style={styles.sources}>
        <Button
          label={t('Camera')}
          icon="camera-outline"
          variant="secondary"
          onPress={() => handlePick('camera')}
          disabled={busy}
          style={styles.source}
        />
        <Button
          label={t('Gallery')}
          icon="images-outline"
          variant="secondary"
          onPress={() => handlePick('gallery')}
          disabled={busy}
          style={styles.source}
        />
      </View>
    </View>
  );
};

const styles = themedStyles(() => ({
  // The same label style as every other field's.
  label: { ...TYPE.label, color: COLORS.textSecondary, marginBottom: 8 },
  preview: {
    aspectRatio: 4 / 3,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryTint,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
  },
  placeholderTitle: {
    ...TYPE.bodyStrong,
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  placeholderHint: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  remove: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.scrim,
  },
  busy: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.veil,
  },
  sources: { flexDirection: 'row', gap: 12, marginTop: 12 },
  source: { flex: 1 },
}));
