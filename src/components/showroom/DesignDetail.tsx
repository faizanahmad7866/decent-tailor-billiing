import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { shownCategory } from '../../i18n/names';
import { t } from '../../i18n/t';
import type { ShowroomDesign } from '../../repositories/patternRepo';
import { designHindi } from '../../utils/designHindi';
import { formatRupees } from '../../utils/money';
import { noteHindi } from '../../utils/noteHindi';
import { designNameSize } from '../../utils/showroom';
import type { DesignPick } from '../../utils/showroomBrowse';
import {
  fabricLabel,
  priceWithFabrics,
  type ShowroomPrice,
} from '../../utils/showroomPricing';
import { Tap } from '../Tap';
import { DesignCard } from './DesignCard';
import { DesignGallery } from './DesignGallery';
import { Eyebrow } from './Eyebrow';
import { FabricChooser } from './FabricChooser';
import { KioskButton } from './KioskButton';
import { AskForPrice, PriceBreakdown } from './PriceBreakdown';
import { showroomType } from './showroomType';
import { useDesignDetail } from './useDesignDetail';

interface DesignDetailProps {
  design: ShowroomDesign;
  /** More of its category, to go on to. */
  related: ShowroomDesign[];
  showPrice: boolean;
  /** The design as it is kept in the picks, if it is. */
  pick: DesignPick | null;
  isPicked: (designId: number) => boolean;
  onTogglePick: (pick: DesignPick) => void;
  onUpdatePick: (pick: DesignPick) => void;
  onTogglePickOf: (design: ShowroomDesign) => void;
  onOpen: (design: ShowroomDesign) => void;
  onClose: () => void;
  onView3D: (startIndex: number) => void;
}

const pickOf = (designId: number, price: ShowroomPrice): DesignPick => ({
  designId,
  pricePaise: price.totalPaise,
  fabrics: price.lines.filter((line) => !line.option.own).map(fabricLabel),
});

/**
 * A design's own page, for a customer to look into it as far as they like: its
 * photos large, to swipe and to see in 3D; its name; its price laid open — each
 * cloth's meters at its rate, and the stitching; the fabric to choose, the price
 * following the choice; the tailor's note; and more of the same kind to go on to.
 * "Add to my picks" keeps it, in the fabric chosen.
 */
export const DesignDetail: React.FC<DesignDetailProps> = ({
  design,
  related,
  showPrice,
  pick,
  isPicked,
  onTogglePick,
  onUpdatePick,
  onTogglePickOf,
  onOpen,
  onClose,
  onView3D,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { detail, failed } = useDesignDetail(design.id);
  const [chosen, setChosen] = useState<(string | undefined)[]>([]);
  const scroll = useRef<ScrollView>(null);

  // A new design opened from "More like this" starts at its top, in its own fabric.
  useEffect(() => {
    setChosen([]);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [design.id]);

  const price = useMemo<ShowroomPrice>(
    () =>
      detail
        ? priceWithFabrics(detail.item, detail.lines, chosen)
        : {
            lines: [],
            clothPaise: 0,
            stitchingPaise: 0,
            totalPaise: design.pricePaise,
            changed: false,
          },
    [detail, chosen, design.pricePaise]
  );

  // A kept design follows the fabric chosen for it after it was kept.
  const picked = pick !== null;
  const pickKey = `${price.totalPaise}|${price.lines.map((l) => l.option.key).join(',')}`;
  useEffect(() => {
    if (picked && detail) onUpdatePick(pickOf(design.id, price));
    // Only when the choice changes, not when the pick it updates comes back.
  }, [pickKey]);

  const wide = width >= 900 && width > height;
  const gutter = width >= 700 ? 40 : 20;
  const hindi = designHindi(design.name);
  const note = detail?.item.note?.trim() || null;
  const noteInHindi = note
    ? noteHindi(note, detail?.item.noteHindi ?? null)
    : null;
  const nameSize = Math.round(designNameSize(design.name, wide) * 0.82);

  const galleryWidth = wide
    ? Math.round((width - insets.left - insets.right) * 0.54) - gutter * 2
    : width - insets.left - insets.right;
  const galleryHeight = wide
    ? height - insets.top - insets.bottom - gutter * 2 - 84
    : Math.round(Math.min(width * 1.18, height * 0.6));

  const choose = (line: number, key: string): void =>
    setChosen((now) => {
      const next = [...now];
      next[line] = key;
      return next;
    });

  const info = (
    <View style={[styles.info, { paddingHorizontal: wide ? 0 : gutter }]}>
      <View style={styles.heading}>
        <Eyebrow>{shownCategory(design.categoryName)}</Eyebrow>
        <Text
          style={[
            showroomType.display,
            { fontSize: nameSize, lineHeight: Math.round(nameSize * 1.1) },
          ]}
        >
          {design.name}
        </Text>
        {hindi ? (
          <Text style={[showroomType.hindi, styles.hindi]}>{hindi}</Text>
        ) : null}
      </View>

      <View style={styles.rule} />

      {showPrice ? (
        <PriceBreakdown price={price} large={wide} />
      ) : (
        <AskForPrice />
      )}

      {detail && detail.lines.length ? (
        <Animated.View entering={FadeIn.duration(300)}>
          <FabricChooser
            lines={detail.lines}
            chosen={chosen}
            onChoose={choose}
            showPrice={showPrice}
          />
        </Animated.View>
      ) : null}

      {note ? (
        <View style={styles.section}>
          <Eyebrow>{t('Note')}</Eyebrow>
          <Text style={[showroomType.body, styles.note]}>{note}</Text>
          {noteInHindi ? (
            <Text style={showroomType.body}>{noteInHindi}</Text>
          ) : null}
        </View>
      ) : null}

      {failed ? (
        <Text style={showroomType.caption}>
          {t("Couldn't open the catalogue")}
        </Text>
      ) : null}

      {related.length ? (
        <View style={styles.section}>
          <Eyebrow>
            {t('More in {0}', shownCategory(design.categoryName))}
          </Eyebrow>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.related}
            style={wide ? null : { marginHorizontal: -gutter }}
          >
            {!wide ? <View style={{ width: gutter - 16 }} /> : null}
            {related.map((other) => (
              <DesignCard
                key={other.id}
                design={other}
                width={wide ? 168 : 150}
                showPrice={showPrice}
                picked={isPicked(other.id)}
                onOpen={() => onOpen(other)}
                onTogglePick={() => onTogglePickOf(other)}
              />
            ))}
            {!wide ? <View style={{ width: gutter - 16 }} /> : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  const actions = (
    <View
      style={[
        styles.actions,
        {
          paddingBottom: insets.bottom + 14,
          paddingHorizontal: wide ? 0 : gutter,
        },
      ]}
    >
      {showPrice && price.totalPaise > 0 ? (
        // Stays in sight while the fabric is chosen further down, and follows it.
        <View style={[styles.barPrice, wide && styles.barPriceWide]}>
          <Text numberOfLines={1} style={showroomType.caption}>
            {price.changed && wide
              ? t('With the fabric you chose')
              : t('Price')}
          </Text>
          <Animated.Text
            key={price.totalPaise}
            entering={FadeIn.duration(320)}
            style={[
              showroomType.figure,
              styles.barFigure,
              wide && styles.barFigureWide,
            ]}
          >
            {formatRupees(price.totalPaise)}
          </Animated.Text>
        </View>
      ) : null}
      <KioskButton
        label={picked ? t('In my picks') : t('Add to my picks')}
        icon={picked ? 'heart' : 'heart-outline'}
        variant={picked ? 'outline' : 'solid'}
        large
        onPress={() => onTogglePick(pickOf(design.id, price))}
        style={[styles.grow, picked && styles.pickedButton]}
      />
    </View>
  );

  const back = (
    <Tap
      onPress={onClose}
      accessibilityLabel={t('Back to the collection')}
      style={[styles.back, !wide && styles.backOver]}
    >
      <Ionicons name="chevron-back" size={20} color={SHOWROOM.text} />
      <Text style={styles.backText}>{t('All designs')}</Text>
    </Tap>
  );

  if (wide) {
    return (
      <View
        style={[
          styles.page,
          styles.row,
          {
            paddingTop: insets.top + gutter,
            paddingLeft: insets.left + gutter,
            paddingRight: insets.right + gutter,
          },
        ]}
      >
        <View style={[styles.galleryColumn, { width: galleryWidth }]}>
          <DesignGallery
            key={design.id}
            images={design.images}
            width={galleryWidth}
            height={galleryHeight}
            onOpen3D={onView3D}
          />
        </View>
        <View style={styles.infoColumn}>
          <View style={styles.topRow}>{back}</View>
          <ScrollView
            ref={scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.infoScroll}
          >
            {info}
          </ScrollView>
          {actions}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.narrowScroll,
          { paddingTop: insets.top },
        ]}
      >
        <DesignGallery
          key={design.id}
          images={design.images}
          width={galleryWidth}
          height={galleryHeight}
          onOpen3D={onView3D}
          inset={gutter}
        />
        {info}
      </ScrollView>
      <View style={[styles.backHolder, { top: insets.top + 12, left: 12 }]}>
        {back}
      </View>
      {actions}
    </View>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: SHOWROOM.ground },
  row: { flexDirection: 'row', gap: 48 },
  galleryColumn: { paddingBottom: 24 },
  infoColumn: { flex: 1, minWidth: 0 },
  infoScroll: { paddingTop: 20, paddingBottom: 32 },
  narrowScroll: { paddingBottom: 140 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: { gap: 28, paddingTop: 24 },
  heading: { gap: 10 },
  hindi: { fontSize: 17 },
  rule: { height: 1, backgroundColor: SHOWROOM.line },
  section: { gap: 12 },
  note: { color: SHOWROOM.text },
  related: { gap: 16 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: SHOWROOM.line,
    backgroundColor: SHOWROOM.ground,
  },
  grow: { flex: 1 },
  pickedButton: { borderColor: SHOWROOM.gold },
  barPrice: { gap: 0, marginRight: 4 },
  barPriceWide: { flex: 1 },
  barFigure: { fontSize: 24, lineHeight: 30, color: SHOWROOM.gold },
  barFigureWide: { fontSize: 30, lineHeight: 36 },
  back: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 22,
  },
  // Over the photo and over the words alike, so it reads on either.
  backOver: {
    borderWidth: 1,
    borderColor: SHOWROOM.lineStrong,
    backgroundColor: SHOWROOM.surface,
  },
  backHolder: { position: 'absolute' },
  backText: { fontFamily: FONT.medium, fontSize: 14, color: SHOWROOM.text },
}));
