import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GUTTER, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { clothRepo, type Cloth } from '../repositories/clothRepo';
import { clothTypeRepo, type ClothType } from '../repositories/clothTypeRepo';
import { parseClothQr } from '../utils/clothQr';
import { haptics } from '../utils/haptics';
import { HEADER_HEIGHT } from './AppHeader';
import { Button } from './Button';
import { IconButton } from './IconButton';

const FRAME_SIZE = 250;
const CORNER = 34;

// How long a message about a wrong code stays, and how long the same code is
// ignored after it: a camera sees one QR dozens of times a second.
const MESSAGE_MS = 2200;

interface ClothScannerProps {
  visible: boolean;
  onClose: () => void;
  /** A cloth's label was scanned and the cloth is in the catalog. */
  /** `type` when the label was a type's own, and the type still exists. */
  onScanned: (cloth: Cloth, type: ClothType | null) => void;
}

/**
 * Full-screen camera that reads a cloth's QR label and finds the cloth in
 * the catalog. A code that isn't a cloth's, or a cloth that has since been
 * deleted, says so and keeps looking; the first good scan closes the camera
 * and hands the cloth over.
 */
export const ClothScanner: React.FC<ClothScannerProps> = ({
  visible,
  onClose,
  onScanned,
}) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Set while a code is being looked up, so a second sighting of it is
  // ignored; and the last wrong code, so it isn't announced again and again.
  const busy = useRef(false);
  const lastRejected = useRef<{ data: string; at: number } | null>(null);

  useEffect(() => {
    if (!visible) return;
    busy.current = false;
    lastRejected.current = null;
    setMessage(null);
    setTorch(false);
  }, [visible]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const reject = (data: string, text: string): void => {
    lastRejected.current = { data, at: Date.now() };
    haptics.scanRefused();
    setMessage(text);
  };

  const handleScan = async (data: string): Promise<void> => {
    if (busy.current) return;
    const recent = lastRejected.current;
    if (recent && recent.data === data && Date.now() - recent.at < MESSAGE_MS) {
      return;
    }

    const code = parseClothQr(data);
    if (code === null) {
      reject(data, t('This is not a DT Billing cloth QR'));
      return;
    }

    busy.current = true;
    try {
      const cloth = await clothRepo.get(code.clothId);
      if (!cloth) {
        busy.current = false;
        reject(data, t('This cloth is not in your catalog any more'));
        return;
      }
      // A type deleted since the label was printed: the cloth itself still is.
      const type =
        code.typeId === null ? null : await clothTypeRepo.get(code.typeId);
      haptics.scanRead();
      onScanned(cloth, type?.clothId === cloth.id ? type : null);
    } catch {
      busy.current = false;
      reject(data, t('Could not read the catalog. Try again'));
    }
  };

  const renderBody = (): React.ReactNode => {
    if (!permission) {
      return (
        <ActivityIndicator color={COLORS.textOnDark} style={styles.fill} />
      );
    }
    if (!permission.granted) {
      return (
        <View style={styles.ask}>
          <Ionicons name="camera-outline" size={48} color={COLORS.textOnDark} />
          <Text style={styles.askTitle}>{t('Camera needed')}</Text>
          <Text style={styles.askText}>
            {t('Allow the camera to scan the QR label on a cloth.')}
          </Text>
          <Button
            label={
              permission.canAskAgain
                ? t('Allow camera')
                : t('Open app settings')
            }
            onPress={() =>
              permission.canAskAgain
                ? void requestPermission()
                : void Linking.openSettings()
            }
          />
        </View>
      );
    }
    return (
      <View style={styles.fill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => void handleScan(data)}
        />
        <View pointerEvents="none" style={styles.frameArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          {message ? (
            <View accessibilityLiveRegion="polite" style={styles.message}>
              <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              {t("Hold the cloth's QR label inside the frame")}
            </Text>
          )}
          <IconButton
            icon={torch ? 'flash' : 'flash-outline'}
            label={torch ? t('Turn the light off') : t('Turn the light on')}
            color={COLORS.textOnDark}
            onPress={() => setTorch((on) => !on)}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.page}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('Scan cloth QR')}
            </Text>
            <IconButton
              icon="close"
              label={t('Close')}
              color={COLORS.textOnDark}
              onPress={onClose}
            />
          </View>
        </View>
        {/* The camera only runs while the scanner is on screen. */}
        {visible ? renderBody() : null}
      </View>
    </Modal>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.ink },
  header: { backgroundColor: COLORS.ink },
  headerRow: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: GUTTER,
    paddingRight: GUTTER - 8,
  },
  title: { ...TYPE.heading, fontSize: 19, color: COLORS.textOnDark },
  fill: { flex: 1 },
  ask: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  askTitle: { ...TYPE.title, color: COLORS.textOnDark },
  askText: {
    ...TYPE.body,
    textAlign: 'center',
    color: COLORS.textOnDarkMuted,
    marginBottom: 8,
  },
  frameArea: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: { width: FRAME_SIZE, height: FRAME_SIZE },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: COLORS.gold,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: RADIUS.md,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: RADIUS.md,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: RADIUS.md,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: RADIUS.md,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    backgroundColor: COLORS.scrim,
  },
  hint: { ...TYPE.bodyStrong, color: COLORS.textOnDark },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
  },
  messageText: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
}));
