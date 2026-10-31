import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AmountRow } from '../components/AmountRow';
import { Button } from '../components/Button';
import { ClothNames } from '../components/ClothNames';
import { ClothThumb } from '../components/ClothThumb';
import { HeaderAction } from '../components/HeaderAction';
import { NoteBlock } from '../components/NoteBlock';
import { ImagePager } from '../components/pattern/ImagePager';
import { PatternVideo } from '../components/pattern/PatternVideo';
import { ShareDesignSheet } from '../components/pattern/ShareDesignSheet';
import { Section } from '../components/Section';
import { LABEL } from '../constants/labels';
import { CARD, COLORS, FONT, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { useBottomInset } from '../layout/useBottomInset';
import { FORM_MAX_WIDTH, useLayout } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import { clothLineName } from '../repositories/billRepo';
import { patternRepo, type PatternItem } from '../repositories/patternRepo';
import { formatMeters, totalLengthCm } from '../utils/billMath';
import { designHindi } from '../utils/designHindi';
import { formatRupees } from '../utils/money';
import { designPriceText } from '../utils/patternPricing';

// Room above and below the photos on a wide tablet: the header, the small
// pictures to jump between them, and the page's own padding.
const PHOTO_PANE_CHROME = 230;

/**
 * One design, shown the way it is shown to a customer: its photos full width
 * (beside the details, on a wide tablet) to swipe through, the name large, the price larger, and the video below to
 * play. Create bill makes a bill from it — its cloths and stitching — and
 * prints it. Share sends the customer a PDF catalogue of it — on WhatsApp to their
 * number, to any app, or saved on the phone; changing the design is under
 * Edit, up in the header.
 */
export const PatternItemScreen: React.FC<RootScreenProps<'PatternItem'>> = ({
  navigation,
  route,
}) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<PatternItem | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { gutter, height, isExpanded, isTablet, pageMaxWidth } = useLayout();
  const bottomInset = useBottomInset();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderAction
          label={t('Edit')}
          icon="create-outline"
          onPress={() => navigation.navigate('PatternItemForm', { itemId })}
        />
      ),
    });
  }, [navigation, itemId]);

  // Read again on return from Edit. A design deleted from there is gone: back
  // to its category.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      patternRepo.getItem(itemId).then(
        (loaded) => {
          if (!active) return;
          if (loaded) setItem(loaded);
          else navigation.goBack();
        },
        () => {
          if (active) setLoadFailed(true);
        }
      );
      return () => {
        active = false;
      };
    }, [itemId, navigation])
  );

  if (!item) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <Text style={styles.failed}>
            {t("Couldn't open this design. Go back and try again.")}
          </Text>
        ) : (
          <ActivityIndicator color={COLORS.accent} style={styles.loading} />
        )}
      </View>
    );
  }

  const details = (
    <View style={[styles.body, { paddingHorizontal: isExpanded ? 0 : gutter }]}>
      <View style={styles.rule} />
      <Text style={styles.category}>{item.categoryName}</Text>
      <Text style={styles.name}>{item.name}</Text>
      {designHindi(item.name) ? (
        <Text style={styles.nameHindi}>{designHindi(item.name)}</Text>
      ) : null}

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>{t('Price · कीमत')}</Text>
        <Text style={styles.price}>{t(designPriceText(item.pricePaise))}</Text>
      </View>

      <Button
        label={t('Create bill · बिल बनाएं')}
        icon="receipt-outline"
        onPress={() => navigation.navigate('NewBill', { designId: itemId })}
        style={styles.share}
      />
      <Button
        label={t('Share design · PDF')}
        icon="logo-whatsapp"
        variant="secondary"
        onPress={() => setSharing(true)}
        style={styles.shareSecond}
      />

      {item.note ? (
        <View style={styles.noteBlock}>
          <NoteBlock note={item.note} saved={item.noteHindi} />
        </View>
      ) : null}

      {item.cloths.length ? (
        <View style={styles.clothNeeded}>
          <Section
            title={t('Cloth needed · कपड़ा')}
            aside={
              <Text style={styles.metersTotal}>
                {t('{0} in all', formatMeters(totalLengthCm(item.cloths)))}
              </Text>
            }
          >
            {item.cloths.map((cloth, index) => (
              <React.Fragment key={`${cloth.clothName}-${index}`}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.clothRow}>
                  <ClothThumb
                    name={cloth.clothName}
                    imageName={cloth.imageName}
                    style={styles.clothThumb}
                  />
                  <View style={styles.clothNames}>
                    <ClothNames
                      title={clothLineName(cloth)}
                      name={cloth.clothName}
                      hindi={cloth.nameHindi}
                      variant={cloth.variant}
                      size={16}
                    />
                    <Text style={styles.clothRate}>
                      {t('{0} / meter', formatRupees(cloth.pricePerMeterPaise))}
                    </Text>
                  </View>
                  <View style={styles.clothFigures}>
                    <Text style={styles.clothMeters}>
                      {formatMeters(cloth.lengthCm)}
                    </Text>
                    <Text style={styles.clothAmount}>
                      {formatRupees(cloth.amountPaise)}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
            <View style={styles.divider} />
            <View style={styles.sums}>
              <AmountRow label={t(LABEL.cloth)} paise={item.clothPaise} />
              <AmountRow
                label={t(LABEL.stitching)}
                paise={item.stitchingPaise}
              />
              <AmountRow
                label={t(LABEL.price)}
                paise={item.pricePaise}
                emphasis
              />
            </View>
          </Section>
        </View>
      ) : null}

      {item.videoName ? (
        <View style={styles.video}>
          <Text style={styles.videoLabel}>{t('Video · वीडियो')}</Text>
          <PatternVideo name={item.videoName} />
        </View>
      ) : null}
    </View>
  );

  const sheet = (
    <ShareDesignSheet
      item={item}
      visible={sharing}
      onClose={() => setSharing(false)}
    />
  );

  if (isExpanded) {
    return (
      <View style={styles.page}>
        <View
          style={[
            styles.split,
            { maxWidth: pageMaxWidth, paddingHorizontal: gutter },
          ]}
        >
          <View style={styles.photos}>
            <View style={styles.photosFrame}>
              <ImagePager
                images={item.images}
                title={item.name}
                maxHeight={height - PHOTO_PANE_CHROME}
              />
            </View>
          </View>
          <ScrollView
            style={styles.detailsPane}
            contentContainerStyle={{ paddingBottom: bottomInset + 32 }}
          >
            {details}
          </ScrollView>
        </View>
        {sheet}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: bottomInset + 32 }}
    >
      <View style={styles.column}>
        <ImagePager
          images={item.images}
          title={item.name}
          // Upright, a tablet's full width would make the photo a page tall.
          maxHeight={isTablet ? height * 0.55 : undefined}
        />
        {details}
      </View>
      {sheet}
    </ScrollView>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  failed: {
    ...TYPE.body,
    textAlign: 'center',
    color: COLORS.textSecondary,
    margin: 40,
  },
  column: { width: '100%', maxWidth: FORM_MAX_WIDTH, alignSelf: 'center' },
  split: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 28,
  },
  photos: { flex: 1, minWidth: 0, paddingTop: 24 },
  photosFrame: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.ivory,
  },
  detailsPane: { flex: 1, minWidth: 0 },
  body: { paddingTop: 20, gap: 8 },
  // A short gold bar: the shop's colour, once, above the name.
  rule: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
    backgroundColor: COLORS.gold,
  },
  category: { ...TYPE.section, color: COLORS.goldText },
  name: {
    fontFamily: FONT.semibold,
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.textPrimary,
  },
  nameHindi: {
    ...TYPE.body,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  priceRow: {
    marginTop: 12,
    padding: 14,
    gap: 2,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...CARD,
  },
  priceLabel: { ...TYPE.section, color: COLORS.textSecondary },
  price: {
    ...TYPE.display,
    color: COLORS.textPrimary,
  },
  share: { marginTop: 12 },
  shareSecond: { marginTop: 10 },
  noteBlock: { marginTop: 16 },
  clothNeeded: { marginTop: 16 },
  metersTotal: { ...TYPE.label, color: COLORS.accent },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  clothRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clothThumb: { width: 48, height: 48, borderRadius: RADIUS.sm },
  clothNames: { flex: 1 },
  clothRate: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 2 },
  clothFigures: { alignItems: 'flex-end', gap: 2 },
  clothAmount: {
    ...TYPE.caption,
    fontVariant: ['tabular-nums'],
    color: COLORS.textSecondary,
  },
  sums: { gap: 10 },
  clothMeters: {
    ...TYPE.price,
    color: COLORS.textPrimary,
  },
  video: { marginTop: 16, gap: 8 },
  videoLabel: { ...TYPE.section, color: COLORS.textSecondary },
}));
