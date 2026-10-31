import type { BillSummary } from '../repositories/billRepo';
import { shownDay } from '../i18n/dates';

export interface BillSection {
  title: string;
  data: BillSummary[];
}

/**
 * Splits bills into one section per day, headed "Today", "Yesterday" or the
 * date. Bills are expected newest first and stay in that order, as do the
 * sections.
 */
export function groupBillsByDay(
  bills: readonly BillSummary[],
  now: Date = new Date()
): BillSection[] {
  const sections: BillSection[] = [];
  for (const bill of bills) {
    const title = shownDay(bill.createdAt, now);
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(bill);
    else sections.push({ title, data: [bill] });
  }
  return sections;
}
