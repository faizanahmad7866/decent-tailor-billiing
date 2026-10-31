import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import {
  FloatingButton,
  FLOATING_BUTTON_CLEARANCE,
} from '../components/FloatingButton';
import { CategoryCard } from '../components/pattern/CategoryCard';
import { CategorySheet } from '../components/pattern/CategorySheet';
import { COLORS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { GRID_GAP, gridLayout } from '../layout/grid';
import { useBottomInset } from '../layout/useBottomInset';
import { useLayout, WIDE_MAX_WIDTH } from '../layout/useLayout';
import type { TabScreenProps } from '../navigation/types';
import {
  DuplicateCategoryNameError,
  patternRepo,
  type PatternCategory,
} from '../repositories/patternRepo';
import { haptics } from '../utils/haptics';

const MIN_CARD_WIDTH = 156;
const MIN_CARD_WIDTH_TABLET = 210;

/**
 * The pattern catalogue's front page: the shop's categories as large photo
 * covers, like the sections of a menu, to hand to a customer. Tapping one
 * opens its designs.
 */
export const PatternsScreen: React.FC<TabScreenProps<'Patterns'>> = ({
  navigation,
}) => {
  const [categories, setCategories] = useState<PatternCategory[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [adding, setAdding] = useState(false);
  const [nameTaken, setNameTaken] = useState<string | null>(null);
  const { contentWidth, gutter, isTablet } = useLayout();
  const bottomInset = useBottomInset();

  // Read again each time the page returns, so a design just added shows as
  // its category's new cover.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      patternRepo.listCategories().then(
        (list) => {
          if (!active) return;
          setCategories(list);
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

  const { columns, cardWidth } = gridLayout(
    Math.min(contentWidth, WIDE_MAX_WIDTH + gutter * 2),
    isTablet ? MIN_CARD_WIDTH_TABLET : MIN_CARD_WIDTH,
    gutter
  );

  const addCategory = async (name: string): Promise<void> => {
    try {
      const id = await patternRepo.createCategory(name);
      haptics.success();
      setAdding(false);
      setNameTaken(null);
      // Straight inside, where the first design goes.
      navigation.navigate('PatternCategory', { categoryId: id });
    } catch (error) {
      haptics.error();
      if (error instanceof DuplicateCategoryNameError) setNameTaken(name);
    }
  };

  const sheet = (
    <CategorySheet
      visible={adding}
      editing={null}
      nameTaken={nameTaken}
      onSave={(name) => void addCategory(name)}
      onDelete={() => {}}
      onClose={() => setAdding(false)}
    />
  );

  if (!categories) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t("Couldn't open the catalogue")}
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

  if (categories.length === 0) {
    return (
      <View style={styles.page}>
        <EmptyState
          icon="albums-outline"
          title={t('Your pattern catalogue is empty')}
          message={t(
            'Add a category like Jodhpuri or Coat, then put your designs in it with photos, a video and the price — and show it to customers like a menu.'
          )}
          action={{
            label: t('Add first category'),
            onPress: () => setAdding(true),
          }}
        />
        {sheet}
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        // A FlatList can't change its column count in place; a new key
        // remounts it when the phone turns or a tablet is resized.
        key={columns}
        data={categories}
        keyExtractor={(category) => String(category.id)}
        numColumns={columns}
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
          <View style={styles.intro}>
            <View style={styles.introText}>
              <Text style={styles.title}>{t('Pattern catalogue')}</Text>
              <Text style={styles.subtitle}>
                {t(
                  '{0} · choose one to see its designs',
                  categories.length === 1
                    ? t('1 category')
                    : t('{0} categories', categories.length)
                )}
              </Text>
            </View>
            <Button
              label={t('Showroom')}
              icon="play-outline"
              variant="secondary"
              onPress={() => navigation.navigate('ShowroomSetup')}
            />
          </View>
        }
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            width={cardWidth}
            onPress={() =>
              navigation.navigate('PatternCategory', { categoryId: item.id })
            }
          />
        )}
      />

      <FloatingButton
        label={t('Add category')}
        icon="add"
        onPress={() => setAdding(true)}
      />
      {sheet}
    </View>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  content: { width: '100%', alignSelf: 'center' },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 20,
    paddingBottom: 16,
  },
  introText: { flex: 1, minWidth: 0 },
  title: { ...TYPE.title, color: COLORS.textPrimary },
  subtitle: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 4 },
  row: { gap: GRID_GAP, marginBottom: GRID_GAP },
}));
