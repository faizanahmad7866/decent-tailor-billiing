import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { clothHindi } from '../../utils/clothHindi';
import { formatRupees } from '../../utils/money';
import { ClothThumb } from '../ClothThumb';
import { Tap } from '../Tap';

interface ClothTypeRowProps {
  name: string;
  pricePerMeterPaise: number;
  imageName: string | null;
  onEdit: () => void;
  /** Its QR label, where the type is saved and so has one. */
  onQr?: () => void;
}

/** One type of a cloth: its photo, name and rate, with its QR and Edit. */
export const ClothTypeRow: React.FC<ClothTypeRowProps> = ({
  name,
  pricePerMeterPaise,
  imageName,
  onEdit,
  onQr,
}) => {
  const hindi = clothHindi(name, null);
  return (
    <View style={styles.row}>
      <ClothThumb name={name} imageName={imageName} style={styles.thumb} />
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        {hindi ? (
          <Text numberOfLines={1} style={styles.hindi}>
            {hindi}
          </Text>
        ) : null}
        <Text style={styles.rate}>
          {t('{0} / meter', formatRupees(pricePerMeterPaise))}
        </Text>
      </View>
      {onQr ? (
        <Tap
          onPress={onQr}
          accessibilityLabel={t('QR label of {0}', name)}
          style={styles.action}
        >
          <Ionicons name="qr-code-outline" size={18} color={COLORS.accent} />
        </Tap>
      ) : null}
      <Tap
        onPress={onEdit}
        accessibilityLabel={t('Edit {0}', name)}
        style={styles.action}
      >
        <Ionicons name="create-outline" size={18} color={COLORS.accent} />
      </Tap>
    </View>
  );
};

const styles = themedStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: RADIUS.md },
  text: { flex: 1, minWidth: 0, gap: 1 },
  name: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  hindi: { ...TYPE.caption, color: COLORS.textSecondary },
  rate: {
    ...TYPE.label,
    fontVariant: ['tabular-nums'],
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  action: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
  },
}));
