import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CustomerActions } from '../components/bill/CustomerActions';
import { CollectPeriodPicker } from '../components/CollectPeriodPicker';
import { DateFilterSheet } from '../components/DateFilterSheet';
import { EmptyState } from '../components/EmptyState';
import {
  FloatingButton,
  FLOATING_BUTTON_CLEARANCE,
} from '../components/FloatingButton';
import { Hero } from '../components/Hero';
import { IconButton } from '../components/IconButton';
import { PillTabs } from '../components/PillTabs';
import { SearchField } from '../components/SearchField';
import { StatusPill } from '../components/StatusPill';
import { Tap } from '../components/Tap';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { shownRange } from '../i18n/dates';
import { t } from '../i18n/t';
import { useBottomInset } from '../layout/useBottomInset';
import { FORM_MAX_WIDTH, useLayout } from '../layout/useLayout';
import type { TabScreenProps } from '../navigation/types';
import {
  billRepo,
  pendingPaise,
  type BillSummary,
} from '../repositories/billRepo';
import { formatMeters } from '../utils/billMath';
import { groupBillsByDay } from '../utils/billList';
import { customerLabel } from '../utils/customer';
import { formatTime } from '../utils/dates';
import { formatDt } from '../utils/dtNumber';
import {
  collectRange,
  isInRange,
  type CollectMonths,
  type DateRange,
} from '../utils/dateRange';
import {
  loadAmountsHidden,
  saveAmountsHidden,
} from '../storage/amountsHiddenStore';
import {
  loadCollectMonths,
  saveCollectMonths,
} from '../storage/collectPeriodStore';
import { formatRupees } from '../utils/money';

type Filter = 'all' | 'pending' | 'paid';

// In place of a total, while the tailor keeps the totals out of a customer's sight.
const HIDDEN_AMOUNT = '₹•••••';

// The summary and filters beside the list, on a tablet wide enough for both.
const SIDE_PANE_WIDTH = 400;

function matchesFilter(bill: BillSummary, filter: Filter): boolean {
  if (filter === 'all') return true;
  return pendingPaise(bill) > 0 === (filter === 'pending');
}

function matchesQuery(bill: BillSummary, needle: string): boolean {
  return (
    bill.customerName.toLowerCase().includes(needle) ||
    (bill.customerMobile ?? '').includes(needle) ||
    (bill.clothText ?? '').toLowerCase().includes(needle) ||
    String(bill.id) === needle.replace(/^#/, '') ||
    (bill.dtNumber !== null &&
      formatDt(bill.dtNumber).toLowerCase().includes(needle))
  );
}

export const BillListScreen: React.FC<TabScreenProps<'Bills'>> = ({
  navigation,
}) => {
  const [bills, setBills] = useState<BillSummary[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  // The days of bills listed; null is every date.
  const [range, setRange] = useState<DateRange | null>(null);
  // How far back the To collect total looks, kept between launches.
  const [collectMonths, setCollectMonths] =
    useState<CollectMonths>(loadCollectMonths);
  // Whether the totals are hidden, kept between launches.
  const [amountsHidden, setAmountsHidden] = useState(loadAmountsHidden);
  const [pickingDates, setPickingDates] = useState(false);
  const { gutter, isExpanded, isTablet } = useLayout();
  const bottomInset = useBottomInset();

  // Reloaded each time the page comes back into view, so a new bill or a
  // payment just taken is reflected the moment the tailor returns.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      billRepo.list().then(
        (list) => {
          if (!active) return;
          setBills(list);
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

  // The To collect panel: the bills of the chosen period (2, 4, 6 months or
  // all), whatever date filter the list below has.
  const overview = useMemo(() => {
    const window = collectRange(collectMonths);
    const counted = (bills ?? []).filter(
      (bill) => !window || isInRange(bill.createdAt, window)
    );
    const billed = counted.reduce((sum, bill) => sum + bill.totalPaise, 0);
    const pending = counted.reduce((sum, bill) => sum + pendingPaise(bill), 0);
    return {
      billed,
      pending,
      collected: billed - pending,
      pendingCount: counted.filter((bill) => pendingPaise(bill) > 0).length,
    };
  }, [bills, collectMonths]);

  // The date filter drives the list and the All / Pending / Paid counts.
  const dated = useMemo(
    () =>
      range
        ? (bills ?? []).filter((b) => isInRange(b.createdAt, range))
        : (bills ?? []),
    [bills, range]
  );
  const datedPending = useMemo(
    () => dated.filter((bill) => pendingPaise(bill) > 0).length,
    [dated]
  );

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groupBillsByDay(
      dated.filter(
        (bill) =>
          matchesFilter(bill, filter) && (!needle || matchesQuery(bill, needle))
      )
    );
  }, [dated, filter, query]);

  const chooseCollectMonths = (months: CollectMonths): void => {
    setCollectMonths(months);
    saveCollectMonths(months);
  };

  const toggleAmounts = (): void => {
    const hidden = !amountsHidden;
    setAmountsHidden(hidden);
    try {
      saveAmountsHidden(hidden);
    } catch {
      // Not remembered: it still holds until the app is closed.
    }
  };

  const total = (paise: number): string =>
    amountsHidden ? HIDDEN_AMOUNT : formatRupees(paise);

  const applyRange = (chosen: DateRange | null): void => {
    setRange(chosen);
    setPickingDates(false);
  };

  const newBill = (): void => navigation.navigate('NewBill');

  if (!bills) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t("Couldn't open your bills")}
            message={t(
              'Something went wrong while reading them. Your data is safe — try again.'
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

  if (bills.length === 0) {
    return (
      <View style={styles.page}>
        <EmptyState
          icon="receipt-outline"
          title={t('No bills yet')}
          message={t(
            'Make a bill with cloth, stitching and a discount, then print it or share it on WhatsApp.'
          )}
          action={{ label: t('Create first bill'), onPress: newBill }}
        />
      </View>
    );
  }

  const filters = [
    { value: 'all', label: t('All'), count: dated.length },
    { value: 'pending', label: t('Pending'), count: datedPending },
    { value: 'paid', label: t('Paid'), count: dated.length - datedPending },
  ] as const;

  const summary = (
    <View style={styles.intro}>
      <Hero>
        <View style={styles.heroTop}>
          <View style={styles.heroFigures}>
            <Text style={styles.heroLabel}>{t('To collect')}</Text>
            <Text style={styles.heroAmount}>{total(overview.pending)}</Text>
            <Text style={styles.heroNote}>
              {overview.pendingCount === 0
                ? t('Everything is paid')
                : t(
                    'from {0} {1}',
                    overview.pendingCount,
                    t(overview.pendingCount === 1 ? 'bill' : 'bills')
                  )}
            </Text>
          </View>
          <View style={styles.heroEye}>
            <IconButton
              icon={amountsHidden ? 'eye-off-outline' : 'eye-outline'}
              label={amountsHidden ? t('Show amounts') : t('Hide amounts')}
              color={COLORS.accent}
              onPress={toggleAmounts}
            />
          </View>
        </View>
        <CollectPeriodPicker
          value={collectMonths}
          onChange={chooseCollectMonths}
        />
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>{t('Billed')}</Text>
            <Text style={styles.tileAmount}>{total(overview.billed)}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>{t('Collected')}</Text>
            <Text style={styles.tileAmount}>{total(overview.collected)}</Text>
          </View>
        </View>
      </Hero>

      <PillTabs options={filters} value={filter} onChange={setFilter} />
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder={t('Search name, mobile, cloth, DT')}
          />
        </View>
        <Tap
          onPress={() => setPickingDates(true)}
          accessibilityLabel={
            range
              ? t('Filter by date, showing {0}', shownRange(range))
              : t('Filter by date')
          }
          style={[styles.filterButton, range && styles.filterActive]}
        >
          <Ionicons
            name="calendar"
            size={22}
            color={range ? COLORS.onPrimary : COLORS.accent}
          />
        </Tap>
      </View>
      {range ? (
        <Tap
          onPress={() => setRange(null)}
          accessibilityLabel={t('Clear date filter, {0}', shownRange(range))}
          style={styles.activeRange}
        >
          <Ionicons name="calendar-outline" size={16} color={COLORS.accent} />
          <Text style={styles.activeRangeText}>{shownRange(range)}</Text>
          <Ionicons name="close-circle" size={18} color={COLORS.accent} />
        </Tap>
      ) : null}
    </View>
  );

  const list = (
    <SectionList
      sections={sections}
      keyExtractor={(bill) => String(bill.id)}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: gutter,
          paddingBottom: bottomInset + FLOATING_BUTTON_CLEARANCE,
          maxWidth: isExpanded ? undefined : FORM_MAX_WIDTH,
        },
      ]}
      // Beside the list on a wide tablet; above it, and scrolling with it,
      // everywhere else.
      ListHeaderComponent={isExpanded ? null : summary}
      ListEmptyComponent={
        <Text style={styles.noMatch}>{t('No bills match.')}</Text>
      }
      renderSectionHeader={({ section }) => (
        <>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {isTablet ? <TableHead /> : null}
        </>
      )}
      renderItem={({ item, index, section }) => (
        <BillRow
          bill={item}
          first={index === 0}
          last={index === section.data.length - 1}
          table={isTablet}
          onPress={() => navigation.navigate('BillDetail', { billId: item.id })}
          onCollect={() =>
            navigation.navigate('CollectPayment', { billId: item.id })
          }
        />
      )}
    />
  );

  return (
    <View style={styles.page}>
      {isExpanded ? (
        <View style={styles.split}>
          <ScrollView
            style={styles.sidePane}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingLeft: gutter,
              paddingRight: 8,
              paddingBottom: bottomInset + 24,
            }}
          >
            {summary}
          </ScrollView>
          <View style={styles.listPane}>{list}</View>
        </View>
      ) : (
        list
      )}

      <FloatingButton label={t('New bill')} icon="add" onPress={newBill} />

      <DateFilterSheet
        visible={pickingDates}
        value={range}
        onApply={applyRange}
        onClose={() => setPickingDates(false)}
      />
    </View>
  );
};

const TableHead: React.FC = () => (
  <View style={styles.tableHead}>
    <Text style={[styles.headText, styles.colNumber]}>{t('No.')}</Text>
    <Text style={[styles.headText, styles.colWide]}>{t('Customer')}</Text>
    <Text style={[styles.headText, styles.colWide]}>{t('Cloth')}</Text>
    <Text style={[styles.headText, styles.colMoney]}>{t('Total')}</Text>
    <Text style={[styles.headText, styles.colBalance]}>{t('Balance')}</Text>
    <View style={styles.colActions} />
  </View>
);

// A day's bills are one ledger: a single bordered surface, rows divided by a
// hairline. On a phone each row stacks; on a tablet they are a table's rows.
const BillRow: React.FC<{
  bill: BillSummary;
  first: boolean;
  last: boolean;
  table: boolean;
  onPress: () => void;
  onCollect: () => void;
}> = ({ bill, first, last, table, onPress, onCollect }) => {
  const name = customerLabel(bill.customerName);
  const due = pendingPaise(bill) > 0;
  const cloth = bill.clothText
    ? `${bill.clothText} · ${formatMeters(bill.totalLengthCm)}`
    : null;
  const label = `${t('Bill No. {0}', bill.id)}, ${name}${cloth ? `, ${cloth}` : ''}, ${formatRupees(bill.totalPaise)}`;

  if (table) {
    return (
      <Tap
        onPress={onPress}
        accessibilityLabel={label}
        style={[styles.tableRow, last && styles.rowLast]}
      >
        <Text style={[styles.cell, styles.colNumber]}>{bill.id}</Text>
        <View style={styles.colWide}>
          <Text numberOfLines={1} style={styles.rowName}>
            {name}
          </Text>
          <Text numberOfLines={1} style={styles.rowMeta}>
            {bill.dtNumber ? `${formatDt(bill.dtNumber)} · ` : ''}
            {formatTime(bill.createdAt)}
          </Text>
        </View>
        <Text numberOfLines={2} style={[styles.cell, styles.colWide]}>
          {cloth ?? '—'}
        </Text>
        <Text style={[styles.cell, styles.colMoney]}>
          {formatRupees(bill.totalPaise)}
        </Text>
        <View style={styles.colBalance}>
          <StatusPill pendingPaise={pendingPaise(bill)} />
        </View>
        <View style={styles.colActions}>
          {due ? (
            <CustomerActions
              bill={bill}
              compact
              iconsOnly
              onCollect={onCollect}
            />
          ) : null}
        </View>
      </Tap>
    );
  }

  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.row, first && styles.rowFirst, last && styles.rowLast]}
    >
      <View style={styles.rowTop}>
        <View style={styles.rowMain}>
          <Text numberOfLines={1} style={styles.rowName}>
            {name}
          </Text>
          {cloth ? (
            <Text numberOfLines={1} style={styles.rowCloth}>
              {cloth}
            </Text>
          ) : null}
          <Text numberOfLines={1} style={styles.rowMeta}>
            {t(
              'No. {0}{1} · {2}',
              bill.id,
              bill.dtNumber ? ` · ${formatDt(bill.dtNumber)}` : '',
              formatTime(bill.createdAt)
            )}
          </Text>
        </View>
        <View style={styles.rowSide}>
          <Text style={styles.rowTotal}>{formatRupees(bill.totalPaise)}</Text>
          <StatusPill pendingPaise={pendingPaise(bill)} />
        </View>
      </View>
      {/* While money is due, the ways to get it: right here, a tap from the list. */}
      {due ? (
        <CustomerActions bill={bill} compact onCollect={onCollect} />
      ) : null}
    </Tap>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  content: { width: '100%', alignSelf: 'center' },
  split: { flex: 1, flexDirection: 'row' },
  sidePane: { flexGrow: 0, width: SIDE_PANE_WIDTH },
  listPane: { flex: 1, minWidth: 0 },
  intro: { paddingTop: 16, gap: 14 },
  searchRow: { flexDirection: 'row', gap: 10 },
  search: { flex: 1 },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    ...CARD,
  },
  filterActive: { backgroundColor: COLORS.primary },
  activeRange: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryTint,
  },
  activeRangeText: { ...TYPE.label, color: COLORS.accent },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start' },
  heroFigures: { flex: 1 },
  // Out into the panel's padding, so the button's 48dp does not push the figures.
  heroEye: { marginTop: -12, marginRight: -12 },
  heroLabel: { ...TYPE.overline, color: COLORS.textSecondary },
  heroAmount: { ...TYPE.display, color: COLORS.textPrimary, marginTop: 4 },
  heroNote: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 2 },
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
  tileAmount: { ...TYPE.price, color: COLORS.textPrimary },
  sectionTitle: {
    ...TYPE.overline,
    color: COLORS.textSecondary,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  noMatch: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  row: {
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  rowMain: { flex: 1, minWidth: 0, gap: 2 },
  rowCloth: { ...TYPE.body, fontSize: 13, color: COLORS.textPrimary },
  rowName: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  rowMeta: { ...TYPE.caption, color: COLORS.textSecondary },
  rowSide: { alignItems: 'flex-end', gap: 4 },
  rowTotal: { ...TYPE.price, color: COLORS.textPrimary },
  // The table of a tablet's list: one set of columns, head and rows alike.
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primaryTint,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  headText: { ...TYPE.section, fontSize: 12, color: COLORS.textSecondary },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    ...TYPE.body,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    color: COLORS.textPrimary,
  },
  colNumber: { width: 40 },
  colWide: { flex: 1, minWidth: 0 },
  colMoney: { width: 76, textAlign: 'right' },
  colBalance: { width: 104, alignItems: 'flex-end', textAlign: 'right' },
  // Room for three small buttons, so every row's columns line up.
  colActions: { width: 120, alignItems: 'flex-end' },
}));
