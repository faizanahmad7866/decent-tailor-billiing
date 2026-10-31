import { t } from '../i18n/t';
/**
 * Adds `id` to the end of the list, or takes it out if it is already there.
 * Order is the order things were tapped in, which is the order they are
 * then added to a bill.
 */
export function toggleSelected(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id];
}

/** "Add 1 cloth" / "Add 3 cloths" */
export function addCountLabel(count: number, noun: string): string {
  return t('Add {0} {1}', count, t(count === 1 ? noun : `${noun}s`));
}
