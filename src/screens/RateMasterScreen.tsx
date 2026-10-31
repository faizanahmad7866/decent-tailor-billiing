import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../components/EmptyState';
import { GarmentImage } from '../components/GarmentImage';
import { RateEditSheet } from '../components/RateEditSheet';
import { Tap } from '../components/Tap';
import { GARMENT_HINDI_NAMES, garmentKey } from '../constants/garments';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { GRID_GAP, gridLayout } from '../layout/grid';
import { useBottomInset } from '../layout/useBottomInset';
import { useLayout, WIDE_MAX_WIDTH } from '../layout/useLayout';
import {
  garmentRateRepo,
  type GarmentRate,
} from '../repositories/garmentRateRepo';
import { formatRupees } from '../utils/money';

const MIN_CARD_WIDTH = 150;

export const RateMasterScreen: React.FC = () => {
  const [rates, setRates] = useState<GarmentRate[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [editing, setEditing] = useState<GarmentRate | null>(null);
  const { contentWidth, gutter } = useLayout();
  const bottomInset = useBottomInset();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      garmentRateRepo.list().then(
        (list) => {
          if (!active) return;
          setRates(list);
          setLoadFailed(false);
        },
        () => {
          if (active) setLoadFailed(true);
        }
      );
      return () => {
        active = false;
      };
    }, [loadAttempt])
  );

  const reload = (): void => setLoadAttempt((attempt) => attempt + 1);

  if (!rates) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t("Couldn't open the rates")}
            message={t('Something went wrong while reading them. Try again.')}
            action={{ label: t('Try again'), onPress: reload }}
          />
        ) : (
          <ActivityIndicator color={COLORS.accent} style={styles.loading} />
        )}
      </View>
    );
  }

  const { columns, cardWidth } = gridLayout(
    Math.min(contentWidth, WIDE_MAX_WIDTH + gutter * 2),
    MIN_CARD_WIDTH,
    gutter
  );

  return (
    <View style={styles.page}>
      <FlatList
        key={columns}
        data={rates}
        keyExtractor={(rate) => String(rate.id)}
        numColumns={columns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: gutter,
            maxWidth: WIDE_MAX_WIDTH + gutter * 2,
            paddingBottom: bottomInset + 24,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.hint}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={COLORS.accent}
            />
            <Text style={styles.hintText}>
              {t(
                'Tap a garment to change its making charge. New bills fill it in for you; bills already made keep their own.'
              )}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RateCard
            rate={item}
            width={cardWidth}
            onPress={() => setEditing(item)}
          />
        )}
      />

      <RateEditSheet
        rate={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
    </View>
  );
};

const RateCard: React.FC<{
  rate: GarmentRate;
  width: number;
  onPress: () => void;
}> = ({ rate, width, onPress }) => {
  const hindi = GARMENT_HINDI_NAMES[garmentKey(rate.name)];
  const price = formatRupees(rate.makingPaise);
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={t(
        '{0}, {1} per piece. Change rate',
        rate.name,
        price
      )}
      style={[styles.card, { width }]}
    >
      <GarmentImage name={rate.name} size={76} />
      <View style={styles.names}>
        <Text numberOfLines={1} style={styles.name}>
          {rate.name}
        </Text>
        {hindi ? (
          <Text numberOfLines={1} style={styles.hindi}>
            {hindi}
          </Text>
        ) : null}
      </View>
      <View style={styles.pricePill}>
        <Text style={styles.price}>{price}</Text>
        <Ionicons name="pencil" size={12} color={COLORS.textSecondary} />
      </View>
    </Tap>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  content: { width: '100%', alignSelf: 'center' },
  hint: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 16,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryTint,
  },
  hintText: {
    ...TYPE.caption,
    flex: 1,
    lineHeight: 18,
    color: COLORS.textPrimary,
  },
  row: { gap: GRID_GAP, marginBottom: GRID_GAP },
  card: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    ...CARD,
  },
  names: { alignItems: 'center', gap: 1 },
  name: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  hindi: { ...TYPE.caption, color: COLORS.textSecondary },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryTint,
  },
  price: { ...TYPE.price, fontSize: 16, color: COLORS.textPrimary },
}));
