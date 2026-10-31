import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ClothThumb } from '../components/ClothThumb';
import { ClothNames } from '../components/ClothNames';
import { ClothPrice } from '../components/ClothPrice';
import { EmptyState } from '../components/EmptyState';
import {
  FloatingButton,
  FLOATING_BUTTON_CLEARANCE,
} from '../components/FloatingButton';
import { SearchField } from '../components/SearchField';
import { Tap } from '../components/Tap';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { GRID_GAP, gridLayout } from '../layout/grid';
import { useBottomInset } from '../layout/useBottomInset';
import { useLayout, WIDE_MAX_WIDTH } from '../layout/useLayout';
import type { TabScreenProps } from '../navigation/types';
import { clothRepo, type Cloth } from '../repositories/clothRepo';
import { searchCloths } from '../utils/clothSearch';
import { formatRupees } from '../utils/money';

const MIN_CARD_WIDTH = 156;
const MIN_CARD_WIDTH_TABLET = 200;

export const ClothListScreen: React.FC<TabScreenProps<'Cloths'>> = ({
  navigation,
}) => {
  const [cloths, setCloths] = useState<Cloth[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const { contentWidth, gutter, isTablet } = useLayout();
  const bottomInset = useBottomInset();

  // Reloaded each time the page comes back into view, so a cloth added or
  // edited on the form is here the moment the tailor returns.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      clothRepo.list().then(
        (list) => {
          if (!active) return;
          setCloths(list);
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

  const visibleCloths = useMemo(
    () => searchCloths(cloths ?? [], query),
    [cloths, query]
  );

  const { columns, cardWidth } = gridLayout(
    Math.min(contentWidth, WIDE_MAX_WIDTH + gutter * 2),
    isTablet ? MIN_CARD_WIDTH_TABLET : MIN_CARD_WIDTH,
    gutter
  );

  const addCloth = (): void => navigation.navigate('ClothForm');

  if (!cloths) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t("Couldn't open the catalog")}
            message={t(
              'Something went wrong while reading your cloths. Your data is safe — try again.'
            )}
            action={{
              label: t('Try again'),
              onPress: () => setLoadAttempt((attempt) => attempt + 1),
            }}
          />
        ) : (
          <ActivityIndicator color={COLORS.accent} style={styles.loading} />
        )}
      </View>
    );
  }

  if (cloths.length === 0) {
    return (
      <View style={styles.page}>
        <EmptyState
          icon="layers-outline"
          title={t('Your cloth catalog is empty')}
          message={t(
            "Add each cloth you sell with a photo and its price per meter. They'll be ready to pick when you make a bill."
          )}
          action={{ label: t('Add first cloth'), onPress: addCloth }}
        />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        // A FlatList can't change its column count in place; a new key
        // remounts it when the phone turns or a tablet is resized.
        key={columns}
        data={visibleCloths}
        keyExtractor={(cloth) => String(cloth.id)}
        numColumns={columns}
        columnWrapperStyle={styles.row}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: gutter,
            maxWidth: WIDE_MAX_WIDTH + gutter * 2,
            paddingBottom: bottomInset + FLOATING_BUTTON_CLEARANCE,
          },
        ]}
        ListHeaderComponent={
          <View style={[styles.intro, isTablet && styles.introRow]}>
            <View style={styles.introText}>
              <Text style={styles.title}>{t('Cloth catalog')}</Text>
              <Text style={styles.subtitle}>
                {t(
                  '{0} · tap one for its QR',
                  cloths.length === 1
                    ? t('1 cloth')
                    : t('{0} cloths', cloths.length)
                )}
              </Text>
            </View>
            <View style={isTablet ? styles.introSearch : undefined}>
              <SearchField
                value={query}
                onChangeText={setQuery}
                placeholder={t('Search name or price, e.g. 1200')}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.noMatch}>
            {t('No cloth matches “{0}”', query.trim())}
          </Text>
        }
        renderItem={({ item }) => (
          <ClothCard
            cloth={item}
            width={cardWidth}
            onPress={() =>
              navigation.navigate('ClothDetail', { clothId: item.id })
            }
          />
        )}
      />

      <FloatingButton label={t('Add cloth')} icon="add" onPress={addCloth} />
    </View>
  );
};

const ClothCard: React.FC<{
  cloth: Cloth;
  width: number;
  onPress: () => void;
}> = ({ cloth, width, onPress }) => {
  const price = formatRupees(cloth.pricePerMeterPaise);
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={t('{0}, {1} per meter', cloth.name, price)}
      style={[styles.card, { width }]}
    >
      <ClothThumb
        name={cloth.name}
        imageName={cloth.imageName}
        style={styles.cardPhoto}
      />
      <View style={styles.cardBody}>
        <ClothNames
          title={cloth.name}
          name={cloth.name}
          hindi={cloth.nameHindi}
          size={17}
          reserveLines={2}
        />
      </View>
      {/* The rate, on a band of its own: what a tailor reads a catalog for. */}
      <View style={styles.priceBand}>
        <ClothPrice paise={cloth.pricePerMeterPaise} size={21} />
      </View>
    </Tap>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  content: { width: '100%', alignSelf: 'center' },
  intro: { paddingTop: 20, paddingBottom: 16, gap: 16 },
  // On a tablet the search stands at the end of the title's line.
  introRow: { flexDirection: 'row', alignItems: 'center' },
  introText: { flex: 1 },
  introSearch: { width: 380 },
  title: { ...TYPE.title, color: COLORS.textPrimary },
  subtitle: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  row: { gap: GRID_GAP, marginBottom: GRID_GAP },
  noMatch: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    ...CARD,
    overflow: 'hidden',
  },
  cardPhoto: { aspectRatio: 4 / 3 },
  cardBody: { padding: 12, paddingBottom: 10 },
  priceBand: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.primaryTint,
  },
}));
