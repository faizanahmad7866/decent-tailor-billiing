import { later, t } from '../i18n/t';
/** What a bill made with no customer name is called on screen. */
export const WALK_IN = later('Walk-in customer');

/**
 * A customer's name for showing on screen: the name, or "Walk-in customer"
 * when none was given — the name is optional, so a bill may have none.
 */
export function customerLabel(name: string): string {
  return name.trim() || t(WALK_IN);
}

/** "Bill 8 — Imran", or just "Bill 8" for a bill with no name. */
export function billTitle(bill: { id: number; customerName: string }): string {
  const name = bill.customerName.trim();
  return name ? `Bill ${bill.id} — ${name}` : `Bill ${bill.id}`;
}
