import { isEmptySummary, summaryLine, type DataSummary } from './dataSummary';

const none: DataSummary = {
  bills: 0,
  cloths: 0,
  designs: 0,
  photos: 0,
  videos: 0,
};

describe('summaryLine', () => {
  it('counts what there is, in plurals', () => {
    expect(
      summaryLine({ bills: 12, cloths: 5, designs: 3, photos: 18, videos: 2 })
    ).toBe('12 bills · 5 cloths · 3 designs · 18 photos · 2 videos');
  });

  it('says one of a thing in the singular and leaves out what there is none of', () => {
    expect(summaryLine({ ...none, bills: 1, photos: 1 })).toBe(
      '1 bill · 1 photo'
    );
  });

  it('says so when there is nothing', () => {
    expect(summaryLine(none)).toBe('Nothing yet');
  });
});

describe('isEmptySummary', () => {
  it('is true only when every count is zero', () => {
    expect(isEmptySummary(none)).toBe(true);
    expect(isEmptySummary({ ...none, videos: 1 })).toBe(false);
  });
});
