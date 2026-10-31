import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState } from '../components/EmptyState';
import {
  FloatingButton,
  FLOATING_BUTTON_CLEARANCE,
} from '../components/FloatingButton';
import { HeaderAction } from '../components/HeaderAction';
import { CategorySheet } from '../components/pattern/CategorySheet';
import { PatternItemCard } from '../components/pattern/PatternItemCard';
import { SearchField } from '../components/SearchField';
import { COLORS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { GRID_GAP, gridLayout } from '../layout/grid';
import { useBottomInset } from '../layout/useBottomInset';
import { useLayout, WIDE_MAX_WIDTH } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import {
  DuplicateCategoryNameError,
  patternRepo,
  type PatternCategory,
  type PatternItemSummary,
} from '../repositories/patternRepo';
import { haptics } from '../utils/haptics';
import { searchPatternItems } from '../utils/patternSearch';

const MIN_CARD_WIDTH = 156;
const MIN_CARD_WIDTH_TABLET = 210;

/**
 * One category's designs as a lookbook: tall photo cards with the name and
 * the price on each. Tapping one shows it full. Renaming or deleting the
 * category is under Edit.
 */
export const PatternCategoryScreen: React.FC<
  RootScreenProps<'PatternCategory'>
> = ({ navigation, route }) => {
  const { categoryId } = route.params;
  const [category, setCategory] = useState<PatternCategory | null>(null);
  const [items, setItems] = useState<PatternItemSummary[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  const [nameTaken, setNameTaken] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { contentWidth, gutter, isTablet } = useLayout();
  const bottomInset = useBottomInset();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: category?.name ?? t('Category'),
      headerRight: () => (
        <HeaderAction
          label={t('Edit')}
          icon="create-outline"
          onPress={() => setEditing(true)}
        />
      ),
    });
  }, [navigation, category?.name]);

  // Read again on return from adding or changing a design. A category deleted
  // from here is gone: back to the catalogue.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        patternRepo.getCategory(categoryId),
        patternRepo.listItems(categoryId),
      ]).then(
        ([loaded, list]) => {
          if (!active) return;
          if (!loaded) {
            navigation.goBack();
            return;
          }
          setCategory(loaded);
          setItems(list);
          setLoadFailed(false);
        },
        () => {
          if (active) setLoadFailed(true);
        }
      );
      return () => {
        active = false;
      };
    }, [categoryId, navigation, loadAttempt])
  );

  const visibleItems = useMemo(
    () => searchPatternItems(items ?? [], query),
    [items, query]
  );

  const { columns, cardWidth } = gridLayout(
    Math.min(contentWidth, WIDE_MAX_WIDTH + gutter * 2),
    isTablet ? MIN_CARD_WIDTH_TABLET : MIN_CARD_WIDTH,
    gutter
  );

  const addItem = (): void =>
    navigation.navigate('PatternItemForm', { categoryId });

  const rename = async (name: string): Promise<void> => {
    try {
      await patternRepo.renameCategory(categoryId, name);
      haptics.success();
      setCategory((current) => (current ? { ...current, name } : current));
      setEditing(false);
      setNameTaken(null);
    } catch (error) {
      haptics.error();
      if (error instanceof DuplicateCategoryNameError) setNameTaken(name);
    }
  };

  const remove = async (): Promise<void> => {
    try {
      await patternRepo.removeCategory(categoryId);
      haptics.success();
      setEditing(false);
      navigation.goBack();
    } catch {
      haptics.error();
    }
  };

  const sheet = (
    <CategorySheet
      visible={editing}
      editing={category?.name ?? null}
      nameTaken={nameTaken}
      onSave={(name) => void rename(name)}
      onDelete={() => void remove()}
      onClose={() => setEditing(false)}
    />
  );

  if (!items || !category) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t("Couldn't open this category")}
            message={t(
              'Something went wrong while reading it. Your data is safe — try again.'
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

  if (items.length === 0) {
    return (
      <View style={styles.page}>
        <EmptyState
          icon="shirt-outline"
          title={t('No designs in {0} yet', category.name)}
          message={t(
            'Add a design with its name, price, photos and a video, and it shows here for your customers.'
          )}
          action={{ label: t('Add first design'), onPress: addItem }}
        />
        {sheet}
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        key={columns}
        data={visibleItems}
        keyExtractor={(item) => String(item.id)}
        numColumns={columns}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        columnWrapperStyle={styles.row}
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
              <Text style={styles.title}>{category.name}</Text>
              <Text style={styles.subtitle}>
                {query.trim()
                  ? t('{0} of {1} designs', visibleItems.length, items.length)
                  : items.length === 1
                    ? t('1 design')
                    : t('{0} designs', items.length)}
              </Text>
            </View>
            <View style={isTablet ? styles.introSearch : undefined}>
              <SearchField
                value={query}
                onChangeText={setQuery}
                placeholder={t('Search name or price, e.g. 15000')}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.noMatch}>
            {t('No design matches “{0}”', query.trim())}
          </Text>
        }
        renderItem={({ item }) => (
          <PatternItemCard
            item={item}
            width={cardWidth}
            onPress={() =>
              navigation.navigate('PatternItem', { itemId: item.id })
            }
          />
        )}
      />

      <FloatingButton label={t('Add design')} icon="add" onPress={addItem} />
      {sheet}
    </View>
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
  subtitle: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 4 },
  noMatch: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  row: { gap: GRID_GAP, marginBottom: GRID_GAP },
}));
