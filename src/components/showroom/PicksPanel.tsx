import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInRight,
  SlideOutDown,
  SlideOutRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { shownCategory } from '../../i18n/names';
import { t } from '../../i18n/t';
import type { ShowroomDesign } from '../../repositories/patternRepo';
import { designHindi } from '../../utils/designHindi';
import { designPriceText } from '../../utils/patternPricing';
import { formatRupees } from '../../utils/money';
import { picksTotal, type DesignPick } from '../../utils/showroomBrowse';
import { Tap } from '../Tap';
import { Eyebrow } from './Eyebrow';
import { KioskButton } from './KioskButton';
import { MatPhoto } from './MatPhoto';
import { showroomType } from './showroomType';

const PANEL_WIDTH = 460;

interface PicksPanelProps {
  picks: DesignPick[];
  designs: ReadonlyMap<number, ShowroomDesign>;
  showPrice: boolean;
  onOpen: (design: ShowroomDesign) => void;
  onRemove: (designId: number) => void;
  onClear: () => void;
  onClose: () => void;
}

/**
 * The designs a customer has kept, to show the tailor: each with its photo, its
 * name, the fabric chosen where it is not the tailor's own, and its price, and
 * what they come to together where prices are shown. From the side on a tablet,
 * from below on a phone.
 */
export const PicksPanel: React.FC<PicksPanelProps> = ({
  picks,
  designs,
  showPrice,
  onOpen,
  onRemove,
  onClear,
  onClose,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const side = width >= 700;
  const kept = picks
    .map((pick) => ({ pick, design: designs.get(pick.designId) }))
    .filter(
      (each): each is { pick: DesignPick; design: ShowroomDesign } =>
        each.design !== undefined
    );
  const { totalPaise, unpriced } = picksTotal(kept.map((each) => each.pick));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(200)}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('Close')}
        />
      </Animated.View>
      <Animated.View
        entering={(side ? SlideInRight : SlideInDown).duration(340)}
        exiting={(side ? SlideOutRight : SlideOutDown).duration(240)}
        style={[
          styles.panel,
          side
            ? {
                top: 0,
                right: 0,
                bottom: 0,
                width: Math.min(PANEL_WIDTH, width * 0.9),
                paddingTop: insets.top + 24,
                paddingRight: insets.right,
              }
            : {
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: height * 0.86,
                paddingTop: 20,
              },
        ]}
      >
        <View style={styles.head}>
          <View style={styles.headWords}>
            <Text style={[showroomType.display, styles.title]}>
              {t('My picks')}
            </Text>
            <Text style={showroomType.caption}>
              {kept.length === 1
                ? t('1 design')
                : t('{0} designs', kept.length)}
            </Text>
          </View>
          <Tap
            onPress={onClose}
            accessibilityLabel={t('Close')}
            style={styles.close}
          >
            <Ionicons name="close" size={22} color={SHOWROOM.text} />
          </Tap>
        </View>

        {kept.length ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listInner}
            showsVerticalScrollIndicator={false}
          >
            {kept.map(({ pick, design }) => (
              <Tap
                key={design.id}
                onPress={() => onOpen(design)}
                accessibilityLabel={design.name}
                style={styles.row}
              >
                <MatPhoto
                  name={design.images[0] ?? null}
                  small
                  inset={5}
                  style={styles.thumb}
                />
                <View style={styles.rowWords}>
                  <Eyebrow>{shownCategory(design.categoryName)}</Eyebrow>
                  <Text
                    numberOfLines={2}
                    style={[showroomType.display, styles.name]}
                  >
                    {design.name}
                  </Text>
                  {designHindi(design.name) ? (
                    <Text numberOfLines={1} style={showroomType.caption}>
                      {designHindi(design.name)}
                    </Text>
                  ) : null}
                  {pick.fabrics.map((fabric) => (
                    <Text key={fabric} numberOfLines={1} style={styles.fabric}>
                      {fabric}
                    </Text>
                  ))}
                  {showPrice ? (
                    <Text style={styles.price}>
                      {t(designPriceText(pick.pricePaise))}
                    </Text>
                  ) : null}
                </View>
                <Tap
                  onPress={() => onRemove(design.id)}
                  haptic="select"
                  accessibilityLabel={t('Remove from my picks')}
                  style={styles.remove}
                >
                  <Ionicons
                    name="close-outline"
                    size={20}
                    color={SHOWROOM.textMuted}
                  />
                </Tap>
              </Tap>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Ionicons
              name="heart-outline"
              size={40}
              color={SHOWROOM.goldDeep}
            />
            <Text style={[showroomType.display, styles.emptyTitle]}>
              {t('Nothing kept yet')}
            </Text>
            <Text style={[showroomType.body, styles.emptyText]}>
              {t(
                'Tap the heart on a design to keep it here, to show the tailor.'
              )}
            </Text>
          </View>
        )}

        {kept.length ? (
          <View style={[styles.foot, { paddingBottom: insets.bottom + 20 }]}>
            {showPrice && totalPaise > 0 ? (
              <View style={styles.total}>
                <View style={styles.totalWords}>
                  <Text style={showroomType.label}>{t('Estimated total')}</Text>
                  {unpriced ? (
                    <Text style={showroomType.caption}>
                      {unpriced === 1
                        ? t('And 1 to ask the price of')
                        : t('And {0} to ask the price of', unpriced)}
                    </Text>
                  ) : null}
                </View>
                <Text style={[showroomType.figure, styles.totalFigure]}>
                  {formatRupees(totalPaise)}
                </Text>
              </View>
            ) : null}
            <Text style={[showroomType.caption, styles.show]}>
              {t('Show this list to the tailor at the counter.')}
            </Text>
            <KioskButton
              label={t('Clear all')}
              icon="trash-outline"
              variant="quiet"
              onPress={onClear}
            />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = themedStyles(() => ({
  backdrop: { backgroundColor: SHOWROOM.backdrop },
  panel: {
    position: 'absolute',
    backgroundColor: SHOWROOM.surface,
    borderColor: SHOWROOM.line,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: SHOWROOM.line,
  },
  headWords: { flex: 1, gap: 2 },
  title: { fontSize: 34, lineHeight: 40 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SHOWROOM.surfaceRaised,
  },
  list: { flexGrow: 0, flexShrink: 1 },
  listInner: { paddingHorizontal: 24, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: SHOWROOM.line,
  },
  thumb: { width: 72, height: 92 },
  rowWords: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 20, lineHeight: 23 },
  fabric: { fontFamily: FONT.regular, fontSize: 12.5, color: SHOWROOM.gold },
  price: {
    marginTop: 2,
    fontFamily: FONT.medium,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.text,
  },
  remove: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
    paddingVertical: 56,
  },
  emptyTitle: { fontSize: 26, textAlign: 'center' },
  emptyText: { textAlign: 'center' },
  foot: { gap: 12, paddingHorizontal: 24, paddingTop: 18 },
  total: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  totalWords: { flex: 1, gap: 2 },
  totalFigure: { fontSize: 30, lineHeight: 34, color: SHOWROOM.gold },
  show: { color: SHOWROOM.textMuted },
}));
