import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import type { Cloth } from '../../repositories/clothRepo';
import type { ClothType } from '../../repositories/clothTypeRepo';
import { clothHindi } from '../../utils/clothHindi';
import { formatRupees } from '../../utils/money';
import { Button } from '../Button';
import { ClothThumb } from '../ClothThumb';
import { Tap } from '../Tap';
import { ClothQrPanel } from './ClothQrPanel';

interface ClothQrSheetProps {
  visible: boolean;
  cloth: Cloth;
  types: ClothType[];
  /** Opens straight on this type's QR; otherwise it asks which one. */
  startType: ClothType | null;
  onChoosePrinter: () => void;
  onClose: () => void;
}

/**
 * A cloth with types has more than one QR, so it asks first: the whole cloth,
 * which is then chosen a type on the bill, or one type, which scans in at its
 * own rate. Then the code, ready to print.
 */
export const ClothQrSheet: React.FC<ClothQrSheetProps> = ({
  visible,
  cloth,
  types,
  startType,
  onChoosePrinter,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  // What the QR is for; undefined while the tailor is still choosing.
  const [target, setTarget] = useState<ClothType | null | undefined>(undefined);

  useEffect(() => {
    if (visible) setTarget(startType ?? undefined);
  }, [visible, startType]);

  const choosing = target === undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('Close')}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text accessibilityRole="header" style={styles.title}>
              {choosing
                ? t('Create QR for')
                : target
                  ? t('QR · {0}', target.name)
                  : t('QR · {0}', cloth.name)}
            </Text>

            {choosing ? (
              <View style={styles.options}>
                <Option
                  title={t('Whole cloth · {0}', cloth.name)}
                  subtitle={t(
                    '{0} / meter · the type is chosen on the bill',
                    formatRupees(cloth.pricePerMeterPaise)
                  )}
                  name={cloth.name}
                  imageName={cloth.imageName}
                  onPress={() => setTarget(null)}
                />
                {types.map((type) => (
                  <Option
                    key={type.id}
                    title={type.name}
                    hindi={clothHindi(type.name, null)}
                    subtitle={t(
                      '{0} / meter',
                      formatRupees(type.pricePerMeterPaise)
                    )}
                    name={type.name}
                    imageName={type.imageName}
                    onPress={() => setTarget(type)}
                  />
                ))}
              </View>
            ) : (
              <>
                <ClothQrPanel
                  cloth={cloth}
                  type={target}
                  onChoosePrinter={onChoosePrinter}
                />
                {startType ? null : (
                  <Button
                    label={t('Choose another')}
                    icon="arrow-back"
                    variant="secondary"
                    onPress={() => setTarget(undefined)}
                  />
                )}
              </>
            )}

            <Button label={t('Close')} variant="secondary" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const Option: React.FC<{
  title: string;
  hindi?: string | null;
  subtitle: string;
  name: string;
  imageName: string | null;
  onPress: () => void;
}> = ({ title, hindi, subtitle, name, imageName, onPress }) => (
  <Tap onPress={onPress} accessibilityLabel={title} style={styles.option}>
    <ClothThumb name={name} imageName={imageName} style={styles.thumb} />
    <View style={styles.optionText}>
      <Text numberOfLines={1} style={styles.optionTitle}>
        {title}
      </Text>
      {hindi ? (
        <Text numberOfLines={1} style={styles.optionSubtitle}>
          {hindi}
        </Text>
      ) : null}
      <Text style={styles.optionSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
  </Tap>
);

const styles = themedStyles(() => ({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.backdrop,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '94%',
    alignSelf: 'center',
    paddingTop: 10,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 6,
  },
  content: { paddingHorizontal: 20, paddingTop: 6, gap: 14 },
  title: { ...TYPE.title, color: COLORS.textPrimary },
  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  thumb: { width: 44, height: 44, borderRadius: RADIUS.sm },
  optionText: { flex: 1, minWidth: 0, gap: 1 },
  optionTitle: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  optionSubtitle: { ...TYPE.caption, color: COLORS.textSecondary },
}));
