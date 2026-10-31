import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { isHindiText, shownCategory } from '../../i18n/names';
import { later, t } from '../../i18n/t';
import type { ShowroomDesign } from '../../repositories/patternRepo';
import type { Offer } from '../../utils/offers';
import type { ShowroomCategory } from '../../utils/showroom';
import {
  DESIGN_SORTS,
  gridColumns,
  isPicked,
  type DesignPick,
  type DesignSort,
} from '../../utils/showroomBrowse';
import { Tap } from '../Tap';
import { EXIT_HOLD_MS } from './AttractView';
import { DesignCard } from './DesignCard';
import { OfferBanner } from './OfferBanner';
import { showroomType } from './showroomType';

const logo = require('../../../assets/brand/logo-gold.png');

const SORT_LABEL: Record<DesignSort, string> = {
  newest: later('Newest'),
  priceLow: later('Lowest price'),
  priceHigh: later('Highest price'),
};

// Cards come in one after another when the grid is made, the first dozen or so.
const STAGGER_MS = 45;
const STAGGERED = 12;

interface BrowseViewProps {
  /** The designs of the category chosen, in the order chosen. */
  designs: ShowroomDesign[];
  /** How many designs there are in all the categories shown. */
  total: number;
  categories: ShowroomCategory[];
  category: number | null;
  onCategory: (id: number | null) => void;
  sort: DesignSort;
  onSort: (sort: DesignSort) => void;
  offers: Offer[];
  showPrice: boolean;
  picks: DesignPick[];
  onOpen: (design: ShowroomDesign) => void;
  onTogglePick: (design: ShowroomDesign) => void;
  onOpenPicks: () => void;
  /** The logo tapped: back to the start. */
  onHome: () => void;
  /** The logo held down: the tailor's way out. */
  onHoldLogo: () => void;
}

/**
 * The collection, for a customer to go through themselves: every design as a
 * lookbook page in a grid, a category at a time or all of them, newest first or by
 * price, with the offers at its head. The heart on a design keeps it in "My
 * picks", whose count stays in the corner.
 */
export const BrowseView: React.FC<BrowseViewProps> = ({
  designs,
  total,
  categories,
  category,
  onCategory,
  sort,
  onSort,
  offers,
  showPrice,
  picks,
  onOpen,
  onTogglePick,
  onOpenPicks,
  onHome,
  onHoldLogo,
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 900;
  const gutter = width >= 700 ? 32 : 20;
  const gap = width >= 700 ? 28 : 16;
  const columns = gridColumns(width);
  const inner = width - insets.left - insets.right - gutter * 2;
  const cardWidth = Math.floor((inner - gap * (columns - 1)) / columns);
  const source = Image.resolveAssetSource(logo);
  const logoHeight = wide ? 36 : 30;
  const chosen = categories.find((each) => each.id === category);
  const heading = chosen ? shownCategory(chosen.name) : t('The collection');

  const tabs = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabs}
      style={wide ? styles.tabsWide : null}
    >
      <CategoryTab
        label={t('All')}
        count={total}
        selected={category === null}
        onPress={() => onCategory(null)}
      />
      {categories.map((each) => (
        <CategoryTab
          key={each.id}
          label={shownCategory(each.name)}
          count={each.count}
          selected={category === each.id}
          onPress={() => onCategory(each.id)}
        />
      ))}
    </ScrollView>
  );

  const header = (
    <View style={styles.listHead}>
      <View style={[styles.titleRow, !wide && styles.titleRowNarrow]}>
        <View style={styles.titleBlock}>
          <Text
            numberOfLines={1}
            style={[
              showroomType.display,
              wide ? styles.titleWide : styles.title,
            ]}
          >
            {heading}
          </Text>
          <Text style={showroomType.caption}>
            {designs.length === 1
              ? t('1 design')
              : t('{0} designs', designs.length)}
          </Text>
        </View>
        {showPrice ? <SortControl sort={sort} onSort={onSort} /> : null}
      </View>
      {offers.length && category === null ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={
            offers.length > 1 ? offerWidth(inner, wide) + gap : undefined
          }
          decelerationRate="fast"
          contentContainerStyle={{ gap }}
          style={styles.offers}
        >
          {offers.map((offer) => (
            <OfferBanner
              key={offer.id}
              offer={offer}
              style={{
                width: offers.length > 1 ? offerWidth(inner, wide) : inner,
              }}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <View style={styles.page}>
      <View
        style={[
          styles.bar,
          {
            paddingTop: insets.top + 14,
            paddingLeft: insets.left + gutter,
            paddingRight: insets.right + gutter,
          },
        ]}
      >
        <View style={styles.barRow}>
          <Pressable
            onPress={onHome}
            onLongPress={onHoldLogo}
            delayLongPress={EXIT_HOLD_MS}
            accessibilityRole="button"
            accessibilityLabel={t('Back to the start')}
            hitSlop={10}
          >
            <Image
              source={logo}
              resizeMode="contain"
              style={{
                height: logoHeight,
                width: (logoHeight * source.width) / source.height,
              }}
            />
          </Pressable>
          {wide ? tabs : <View style={styles.spacer} />}
          <PicksButton count={picks.length} wide={wide} onPress={onOpenPicks} />
        </View>
        {wide ? null : tabs}
      </View>

      <FlatList
        // Made anew for each category, order and width, so it starts at the top
        // and the cards come in again.
        key={`${columns}-${category}-${sort}`}
        data={designs}
        numColumns={columns}
        keyExtractor={(design) => String(design.id)}
        ListHeaderComponent={header}
        columnWrapperStyle={columns > 1 ? { gap } : undefined}
        contentContainerStyle={{
          paddingLeft: insets.left + gutter,
          paddingRight: insets.right + gutter,
          paddingBottom: insets.bottom + 48,
          gap: gap + 12,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={columns * 3}
        windowSize={7}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeIn.duration(450).delay(
              Math.min(index, STAGGERED) * STAGGER_MS
            )}
          >
            <DesignCard
              design={item}
              width={cardWidth}
              showPrice={showPrice}
              picked={isPicked(picks, item.id)}
              onOpen={() => onOpen(item)}
              onTogglePick={() => onTogglePick(item)}
            />
          </Animated.View>
        )}
      />
    </View>
  );
};

/** One offer's width beside another, so the next shows at the edge. */
const offerWidth = (inner: number, wide: boolean): number =>
  Math.round(wide ? (inner - 28) / 2 : inner * 0.86);

const CategoryTab: React.FC<{
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}> = ({ label, count, selected, onPress }) => (
  <Tap
    onPress={onPress}
    haptic="select"
    throttle={false}
    accessibilityRole="tab"
    accessibilityState={{ selected }}
    accessibilityLabel={`${label}, ${count}`}
    style={[styles.tab, selected && styles.tabSelected]}
  >
    <Text
      style={[
        styles.tabText,
        !isHindiText(label) && styles.tabSpaced,
        selected && styles.tabTextSelected,
      ]}
    >
      {label}
      <Text style={styles.tabCount}>{`  ${count}`}</Text>
    </Text>
  </Tap>
);

const SortControl: React.FC<{
  sort: DesignSort;
  onSort: (sort: DesignSort) => void;
}> = ({ sort, onSort }) => (
  <View style={styles.sorts} accessibilityRole="radiogroup">
    {DESIGN_SORTS.map((each) => (
      <Tap
        key={each}
        onPress={() => onSort(each)}
        haptic="select"
        throttle={false}
        accessibilityRole="radio"
        accessibilityState={{ selected: sort === each }}
        style={[styles.sort, sort === each && styles.sortSelected]}
      >
        <Text
          style={[styles.sortText, sort === each && styles.sortTextSelected]}
        >
          {t(SORT_LABEL[each])}
        </Text>
      </Tap>
    ))}
  </View>
);

const PicksButton: React.FC<{
  count: number;
  wide: boolean;
  onPress: () => void;
}> = ({ count, wide, onPress }) => (
  <Tap
    onPress={onPress}
    accessibilityLabel={t('My picks, {0}', count)}
    style={styles.picks}
  >
    <Ionicons
      name={count ? 'heart' : 'heart-outline'}
      size={18}
      color={count ? SHOWROOM.gold : SHOWROOM.text}
    />
    {wide ? <Text style={styles.picksText}>{t('My picks')}</Text> : null}
    {count ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    ) : null}
  </Tap>
);

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: SHOWROOM.ground },
  bar: {
    borderBottomWidth: 1,
    borderBottomColor: SHOWROOM.line,
    backgroundColor: SHOWROOM.ground,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    minHeight: 52,
  },
  spacer: { flex: 1 },
  tabs: { gap: 4, alignItems: 'center' },
  tabsWide: { flex: 1 },
  tab: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabSelected: { borderBottomColor: SHOWROOM.gold },
  tabText: {
    fontFamily: FONT.medium,
    fontSize: 12.5,
    textTransform: 'uppercase',
    color: SHOWROOM.textMuted,
  },
  tabSpaced: { letterSpacing: 1.6 },
  tabTextSelected: { color: SHOWROOM.text },
  tabCount: {
    fontFamily: FONT.regular,
    fontSize: 11,
    letterSpacing: 0,
    color: SHOWROOM.textFaint,
  },
  listHead: { paddingTop: 28, paddingBottom: 8, gap: 24 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  titleRowNarrow: { flexDirection: 'column', alignItems: 'flex-start' },
  titleBlock: { gap: 4, flexShrink: 1 },
  title: { fontSize: 34, lineHeight: 38 },
  titleWide: { fontSize: 44, lineHeight: 48 },
  offers: { marginHorizontal: -2 },
  sorts: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: SHOWROOM.line,
    borderRadius: 2,
  },
  sort: { height: 38, paddingHorizontal: 14, justifyContent: 'center' },
  sortSelected: { backgroundColor: SHOWROOM.surfaceRaised },
  sortText: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: SHOWROOM.textMuted,
  },
  sortTextSelected: { color: SHOWROOM.text },
  picks: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: SHOWROOM.lineStrong,
    borderRadius: 2,
  },
  picksText: { fontFamily: FONT.medium, fontSize: 14, color: SHOWROOM.text },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SHOWROOM.gold,
  },
  badgeText: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.onLight,
  },
}));
