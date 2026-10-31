import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LABEL } from '../../constants/labels';
import {
  CARD,
  COLORS,
  FONT,
  RADIUS,
  TYPE,
  tracking,
} from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { shownDateTime } from '../../i18n/dates';
import { t } from '../../i18n/t';
import { SHOP } from '../../print/shop';
import {
  clothLineName,
  pendingPaise,
  type Bill,
} from '../../repositories/billRepo';
import { formatMeters } from '../../utils/billMath';
import { clothLineHindi } from '../../utils/clothHindi';
import { customerLabel } from '../../utils/customer';
import { formatDt } from '../../utils/dtNumber';
import { formatRupees } from '../../utils/money';
import { formatMobile } from '../../utils/phone';
import { StatusPill } from '../StatusPill';

const logo = require('../../../assets/brand/logo-gold.png');
// The logo file's own proportions.
const LOGO_HEIGHT = 48;
const LOGO_WIDTH = (LOGO_HEIGHT * 1235) / 902;

/**
 * A saved bill as a bill: the shop's letterhead and the bill's number and date,
 * who it is for, the cloth and the stitching as tables of quantity, rate and
 * amount, and the totals ruled off at the foot — read top to bottom like the
 * paper it stands for, in the same order as what is printed and sent.
 */
export const BillDocument: React.FC<{ bill: Bill }> = ({ bill }) => {
  const pending = pendingPaise(bill);
  return (
    <View style={styles.paper}>
      <View style={styles.letterhead}>
        <View style={styles.shop}>
          <Image
            source={logo}
            resizeMode="contain"
            accessibilityLabel={SHOP.name}
            style={styles.logo}
          />
          <Text style={styles.shopLine}>{SHOP.address}</Text>
          {SHOP.contacts.map(({ label, phone }) => (
            <Text key={phone} style={styles.shopLine}>
              {label} {formatMobile(phone)}
            </Text>
          ))}
        </View>
        <View style={styles.billId}>
          <Text style={styles.billWord}>{t('BILL')}</Text>
          <Text style={styles.billNumber}>{t('No. {0}', bill.id)}</Text>
          {bill.dtNumber ? (
            <Text style={styles.billNumber}>{formatDt(bill.dtNumber)}</Text>
          ) : null}
          <Text style={styles.shopLine}>{shownDateTime(bill.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.party}>
        <View style={styles.partyWho}>
          <Text style={styles.heading}>{t('Billed to')}</Text>
          <Text style={styles.customer}>
            {customerLabel(bill.customerName)}
          </Text>
          {bill.customerMobile ? (
            <Text style={styles.shopLine}>
              {formatMobile(bill.customerMobile)}
            </Text>
          ) : null}
        </View>
        <StatusPill pendingPaise={pending} />
      </View>

      {bill.cloths.length ? (
        <View style={styles.table}>
          <HeadRow first={t(LABEL.cloth)} second={t('Meters')} />
          {bill.cloths.map((cloth) => {
            const hindi = clothLineHindi(
              cloth.clothName,
              cloth.clothNameHindi,
              cloth.variant
            );
            return (
              <View key={cloth.id} style={styles.row}>
                <View style={styles.description}>
                  <Text style={styles.item}>{clothLineName(cloth)}</Text>
                  {hindi ? <Text style={styles.itemHindi}>{hindi}</Text> : null}
                  {/* For the tailor's eyes only; the printed bill shows just
                      the rate charged. */}
                  {cloth.extraPerMeterPaise ? (
                    <Text style={styles.itemNote}>
                      {cloth.extraPerMeterPaise > 0
                        ? t(
                            'Includes {0} extra per meter',
                            formatRupees(cloth.extraPerMeterPaise)
                          )
                        : t(
                            '{0} less per meter',
                            formatRupees(-cloth.extraPerMeterPaise)
                          )}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.cell, styles.quantity]}>
                  {formatMeters(cloth.lengthCm)}
                </Text>
                <Text style={[styles.cell, styles.rate]}>
                  {formatRupees(cloth.pricePerMeterPaise)}
                </Text>
                <Text style={[styles.cell, styles.amount]}>
                  {formatRupees(cloth.amountPaise)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {bill.garments.length ? (
        <View style={styles.table}>
          <HeadRow first={t(LABEL.stitching)} second={t('Qty')} />
          {bill.garments.map((garment) => (
            <View key={garment.id} style={styles.row}>
              <View style={styles.description}>
                <Text style={styles.item}>{garment.name}</Text>
              </View>
              <Text style={[styles.cell, styles.quantity]}>
                {garment.quantity}
              </Text>
              <Text style={[styles.cell, styles.rate]}>
                {formatRupees(garment.makingPaise)}
              </Text>
              <Text style={[styles.cell, styles.amount]}>
                {formatRupees(garment.amountPaise)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.totals}>
        {bill.clothPaise ? (
          <TotalRow
            label={t(LABEL.cloth)}
            value={formatRupees(bill.clothPaise)}
          />
        ) : null}
        {bill.makingPaise ? (
          <TotalRow
            label={t(LABEL.making)}
            value={formatRupees(bill.makingPaise)}
          />
        ) : null}
        {bill.discountPaise ? (
          <TotalRow
            label={t(LABEL.discount)}
            value={`−${formatRupees(bill.discountPaise)}`}
          />
        ) : null}
        <TotalRow
          label={t(LABEL.total)}
          value={formatRupees(bill.totalPaise)}
          strong
        />
        {bill.paidPaise ? (
          <TotalRow
            label={t(LABEL.paid)}
            value={formatRupees(bill.paidPaise)}
          />
        ) : null}
        {pending > 0 ? (
          <View style={styles.balance}>
            <Text style={styles.balanceText}>{t(LABEL.balanceDue)}</Text>
            <Text style={styles.balanceText}>{formatRupees(pending)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const HeadRow: React.FC<{ first: string; second: string }> = ({
  first,
  second,
}) => (
  <View style={styles.head}>
    <Text style={[styles.headText, styles.description]}>{first}</Text>
    <Text style={[styles.headText, styles.quantity]}>{second}</Text>
    <Text style={[styles.headText, styles.rate]}>{t('Rate')}</Text>
    <Text style={[styles.headText, styles.amount]}>{t('Amount')}</Text>
  </View>
);

const TotalRow: React.FC<{
  label: string;
  value: string;
  strong?: boolean;
}> = ({ label, value, strong = false }) => (
  <View style={[styles.totalRow, strong && styles.totalStrong]}>
    <Text style={[styles.totalLabel, strong && styles.totalStrongText]}>
      {label}
    </Text>
    <Text style={[styles.totalValue, strong && styles.totalStrongText]}>
      {value}
    </Text>
  </View>
);

const styles = themedStyles(() => ({
  paper: {
    padding: 16,
    gap: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...CARD,
  },
  letterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textPrimary,
  },
  shop: { flex: 1, gap: 3 },
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT, marginBottom: 4 },
  shopLine: { ...TYPE.caption, color: COLORS.textSecondary },
  billId: { alignItems: 'flex-end', gap: 2 },
  billWord: {
    fontFamily: FONT.semibold,
    fontSize: 18,
    letterSpacing: tracking(2),
    color: COLORS.textPrimary,
  },
  billNumber: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  party: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  partyWho: { flex: 1, gap: 2 },
  heading: { ...TYPE.overline, color: COLORS.textSecondary },
  customer: { ...TYPE.bodyStrong, fontSize: 16, color: COLORS.textPrimary },
  table: { borderWidth: 1, borderColor: COLORS.border },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headText: { ...TYPE.section, fontSize: 12, color: COLORS.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  description: { flex: 1, minWidth: 0, gap: 1, paddingRight: 8 },
  item: { ...TYPE.section, fontSize: 14, color: COLORS.textPrimary },
  itemHindi: { ...TYPE.caption, color: COLORS.textSecondary },
  itemNote: { ...TYPE.caption, color: COLORS.textMuted },
  cell: {
    ...TYPE.body,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    color: COLORS.textPrimary,
  },
  quantity: { width: 50, textAlign: 'right' },
  rate: { width: 62, textAlign: 'right' },
  amount: { width: 72, textAlign: 'right' },
  totals: { alignSelf: 'flex-end', width: '100%', maxWidth: 340, gap: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { ...TYPE.body, fontSize: 14, color: COLORS.textSecondary },
  totalValue: {
    ...TYPE.body,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    color: COLORS.textPrimary,
  },
  totalStrong: {
    marginVertical: 2,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.textPrimary,
  },
  totalStrongText: {
    fontFamily: FONT.semibold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  balance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.warningTint,
  },
  balanceText: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    color: COLORS.warning,
  },
}));
