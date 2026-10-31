import { t } from '../i18n/t';
// What the app holds, in a line a tailor can check: used on the backup page
// to show what the backup will carry, and on the delete page to show what
// will go.

export interface DataSummary {
  bills: number;
  cloths: number;
  designs: number;
  /** Cloth photos and the catalogue's photos. */
  photos: number;
  videos: number;
}

const NOUNS: Record<keyof DataSummary, [string, string]> = {
  bills: ['bill', 'bills'],
  cloths: ['cloth', 'cloths'],
  designs: ['design', 'designs'],
  photos: ['photo', 'photos'],
  videos: ['video', 'videos'],
};

const ORDER: (keyof DataSummary)[] = [
  'bills',
  'cloths',
  'designs',
  'photos',
  'videos',
];

/** "12 bills · 5 cloths · 3 designs · 18 photos"; what there is none of is left out. */
export function summaryLine(summary: DataSummary): string {
  const parts = ORDER.filter((key) => summary[key] > 0).map((key) => {
    const [one, many] = NOUNS[key];
    return `${summary[key]} ${t(summary[key] === 1 ? one : many)}`;
  });
  return parts.length ? parts.join(' · ') : t('Nothing yet');
}

/** True when there is nothing in the app to back up or delete. */
export function isEmptySummary(summary: DataSummary): boolean {
  return ORDER.every((key) => summary[key] === 0);
}
