import { MIGRATIONS } from './migrations';

// The steps as they have shipped, in the order phones ran them: what each one
// begins with, and so how many phones are already past it. Every step ever
// released stays on this list, in this place. A new step goes at the end of
// BOTH this list and MIGRATIONS — this test fails if one is slipped into the
// middle, which would make the app fail to start on phones that ran the old
// step at that position.
const SHIPPED_STEPS = [
  'CREATE TABLE cloths',
  'CREATE TABLE bills',
  'ALTER TABLE bill_cloths ADD COLUMN cloth_id',
  'CREATE TABLE garment_rates',
  'ALTER TABLE cloths ADD COLUMN name_hi',
  'CREATE TABLE pattern_categories',
  'INSERT OR IGNORE INTO pattern_categories',
  'ALTER TABLE pattern_items ADD COLUMN stitching_paise',
  'ALTER TABLE pattern_item_cloths ADD COLUMN variant',
  'ALTER TABLE cloths ADD COLUMN note',
  'CREATE TABLE cloth_types',
  'ALTER TABLE bills ADD COLUMN dt_number',
] as const;

describe('MIGRATIONS', () => {
  it('has exactly the steps that have shipped, in the order they shipped', () => {
    expect(MIGRATIONS).toHaveLength(SHIPPED_STEPS.length);
    SHIPPED_STEPS.forEach((start, index) => {
      expect(MIGRATIONS[index].trimStart().startsWith(start)).toBe(true);
    });
  });

  // The names in these tables are unique, and a tailor may already have made
  // some of the same name before the step ran: a plain INSERT would then fail,
  // and the app would not start.
  it('seeds the pattern categories without failing on names already there', () => {
    const seed = MIGRATIONS.find(
      (step) => /INTO pattern_categories/.test(step) && /SELECT/.test(step)
    );
    expect(seed).toMatch(/^\s*INSERT OR IGNORE INTO pattern_categories/);
  });

  it('gives no step that creates a table a second time', () => {
    const created = MIGRATIONS.flatMap((step) =>
      [...step.matchAll(/CREATE TABLE (\w+)/g)].map((match) => match[1])
    );
    expect(new Set(created).size).toBe(created.length);
  });
});
