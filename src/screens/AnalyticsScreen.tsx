import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { DateFilterSheet } from '../components/DateFilterSheet';
import { EmptyState } from '../components/EmptyState';
import { Hero } from '../components/Hero';
import { Section } from '../components/Section';
import { SegmentedControl } from '../components/SegmentedControl';
import { Tap } from '../components/Tap';
import { COLORS, FONT, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { shownRange } from '../i18n/dates';
import { t } from '../i18n/t';
import { PageColumn, PageColumns, usePagePadding } from '../layout/Page';
import { billRepo } from '../repositories/billRepo';
import { formatMeters } from '../utils/billMath';
import { clothHindi } from '../utils/clothHindi';
import {
  DEFAULT_SALES_PERIOD,
  SALES_PERIODS,
  salesRange,
  summarizeClothSales,
  type ClothSale,
  type ClothSaleLine,
  type SalesPeriod,
} from '../utils/clothSales';
import type { DateRange } from '../utils/dateRange';
import { formatRupees } from '../utils/money';

type PeriodChoice = '1' | '2' | '6' | 'custom';

const periodOptions = (): readonly { value: PeriodChoice; label: string }[] => [
  ...SALES_PERIODS.map((months) => ({
    value: String(months) as PeriodChoice,
    label: months === 1 ? t('1 month') : t('{0} months', months),
  })),
  { value: 'custom', label: t('Custom') },
];

/**
 * What the cloth business did over a stretch of days: the total, then each cloth
 * in order of what it brought in. Opens on the last month every time.
 */
export const AnalyticsScreen: React.FC = () => {
  const pagePadding = usePagePadding();
  const [lines, setLines] = useState<ClothSaleLine[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [choice, setChoice] = useState<PeriodChoice>(
    String(DEFAULT_SALES_PERIOD) as PeriodChoice
  );
  const [custom, setCustom] = useState<DateRange | null>(null);
  const [pickingDates, setPickingDates] = useState(false);

  // Read again on return, so a bill just made is counted.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      billRepo.clothSaleLines().then(
        (loaded) => {
          if (!active) return;
          setLines(loaded);
          setLoadFailed(false);
        },
        () => {
          if (active) setLoadFailed(true);
        }
      );
      return () => {
        active = false;
      };
    }, [])
  );

  const range =
    choice === 'custom' && custom
      ? custom
      : salesRange(
          choice === 'custom'
            ? DEFAULT_SALES_PERIOD
            : (Number(choice) as SalesPeriod)
        );
  const rangeKey = `${range.from.getTime()}-${range.to.getTime()}`;
  const summary = useMemo(
    () => summarizeClothSales(lines ?? [], range),
    // The days themselves, not the object made afresh on each render.
    [lines, rangeKey]
  );

  const choose = (next: PeriodChoice): void => {
    // Custom takes effect once days are picked; until then the page stays put.
    if (next === 'custom') setPickingDates(true);
    else setChoice(next);
  };

  if (!lines) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t("Couldn't read your bills")}
            message={t(
              'Something went wrong. Your data is safe — go back and try again.'
            )}
          />
        ) : (
          <ActivityIndicator color={COLORS.accent} style={styles.loading} />
        )}
      </View>
    );
  }

  const top = summary.cloths[0]?.amountPaise ?? 0;

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={pagePadding}>
        <PageColumn wide>
          <PageColumns
            first={
              <>
                <SegmentedControl
                  options={periodOptions()}
                  value={choice}
                  onChange={choose}
                />
                {choice === 'custom' ? (
                  <Tap
                    onPress={() => setPickingDates(true)}
                    accessibilityLabel={t(
                      'Change the dates, {0}',
                      shownRange(range)
                    )}
                    style={styles.rangeButton}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={COLORS.accent}
                    />
                    <Text style={styles.rangeText}>{shownRange(range)}</Text>
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={COLORS.accent}
                    />
                  </Tap>
                ) : (
                  <Text style={styles.rangeNote}>{shownRange(range)}</Text>
                )}

                <Hero>
                  <Text style={styles.heroLabel}>
                    {t('Cloth sold · कपड़ा बिक्री')}
                  </Text>
                  <Text style={styles.heroAmount}>
                    {formatRupees(summary.amountPaise)}
                  </Text>
                  <View style={styles.tiles}>
                    <Tile
                      label={t('Meters')}
                      value={formatMeters(summary.lengthCm)}
                    />
                    <Tile
                      label={t('Bills')}
                      value={String(summary.billCount)}
                    />
                    <Tile
                      label={t('Cloths')}
                      value={String(summary.cloths.length)}
                    />
                  </View>
                </Hero>
                <Text style={styles.note}>
                  {t(
                    'Cloth only, before any discount on the bill: a discount is on the whole bill, not on one cloth.'
                  )}
                </Text>
              </>
            }
            second={
              <Section title={t('Cloth by cloth · कपड़े के हिसाब से')}>
                {summary.cloths.length ? (
                  summary.cloths.map((cloth, index) => (
                    <React.Fragment key={cloth.key}>
                      {index > 0 ? <View style={styles.rule} /> : null}
                      <ClothRow cloth={cloth} top={top} />
                    </React.Fragment>
                  ))
                ) : (
                  <Text style={styles.none}>
                    {t('No cloth was sold in these days.')}
                  </Text>
                )}
              </Section>
            }
          />
        </PageColumn>
      </ScrollView>

      <DateFilterSheet
        visible={pickingDates}
        value={custom}
        title={t('Choose dates')}
        applyLabel={t('Show these days')}
        allowAll={false}
        onApply={(picked) => {
          setPickingDates(false);
          if (picked) {
            setCustom(picked);
            setChoice('custom');
          }
        }}
        onClose={() => setPickingDates(false)}
      />
    </View>
  );
};

const Tile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.tile}>
    <Text style={styles.tileLabel}>{label}</Text>
    <Text style={styles.tileValue}>{value}</Text>
  </View>
);

/** One cloth: its figures, a bar against the best seller, and its types. */
const ClothRow: React.FC<{ cloth: ClothSale; top: number }> = ({
  cloth,
  top,
}) => {
  const hindi = clothHindi(cloth.clothName, cloth.clothNameHindi);
  return (
    <View style={styles.cloth}>
      <View style={styles.clothTop}>
        <View style={styles.clothNames}>
          <Text style={styles.clothName}>{cloth.clothName}</Text>
          {hindi ? <Text style={styles.clothHindi}>{hindi}</Text> : null}
        </View>
        <View style={styles.clothFigures}>
          <Text style={styles.clothAmount}>
            {formatRupees(cloth.amountPaise)}
          </Text>
          <Text style={styles.clothMeters}>{formatMeters(cloth.lengthCm)}</Text>
        </View>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.bar,
            { width: `${top > 0 ? (cloth.amountPaise / top) * 100 : 0}%` },
          ]}
        />
      </View>
      <Text style={styles.clothMeta}>
        {t(
          '{0}% of cloth sold · {1} {2}',
          Math.round(cloth.share * 100),
          cloth.billCount,
          t(cloth.billCount === 1 ? 'bill' : 'bills')
        )}
      </Text>
      {cloth.types.map((type) => (
        <View key={type.name ?? 'none'} style={styles.typeRow}>
          <Text numberOfLines={1} style={styles.typeName}>
            {type.name ?? t('No type')}
          </Text>
          <Text style={styles.typeFigure}>{formatMeters(type.lengthCm)}</Text>
          <Text style={[styles.typeFigure, styles.typeAmount]}>
            {formatRupees(type.amountPaise)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  rangeNote: { ...TYPE.label, color: COLORS.textSecondary, marginLeft: 2 },
  rangeButton: {
    alignSelf: 'flex-start',
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
  },
  rangeText: { ...TYPE.label, color: COLORS.textPrimary },
  heroLabel: { ...TYPE.section, color: COLORS.textSecondary },
  heroAmount: { ...TYPE.display, color: COLORS.textPrimary, marginTop: 4 },
  tiles: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tile: { flex: 1, gap: 2 },
  tileLabel: { ...TYPE.caption, color: COLORS.textSecondary },
  tileValue: { ...TYPE.price, color: COLORS.textPrimary },
  note: { ...TYPE.caption, lineHeight: 17, color: COLORS.textSecondary },
  none: { ...TYPE.body, color: COLORS.textSecondary },
  rule: { height: 1, backgroundColor: COLORS.border },
  cloth: { gap: 6 },
  clothTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  clothNames: { flex: 1, minWidth: 0 },
  clothName: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  clothHindi: { ...TYPE.caption, color: COLORS.textSecondary },
  clothFigures: { alignItems: 'flex-end' },
  clothAmount: { ...TYPE.price, color: COLORS.textPrimary },
  clothMeters: {
    ...TYPE.caption,
    fontVariant: ['tabular-nums'],
    color: COLORS.textSecondary,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: COLORS.primaryTint,
  },
  bar: { height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  clothMeta: { ...TYPE.caption, color: COLORS.textSecondary },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },
  typeName: { ...TYPE.label, flex: 1, color: COLORS.textPrimary },
  typeFigure: {
    fontFamily: FONT.regular,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    color: COLORS.textSecondary,
  },
  typeAmount: { width: 76, textAlign: 'right', color: COLORS.textPrimary },
}));
