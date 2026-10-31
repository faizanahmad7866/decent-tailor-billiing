import {
  designNameSize,
  photoFadeStarts,
  isFullPin,
  showroomCategories,
  showroomSlideMs,
  showroomSlides,
} from './showroom';

const design = (categoryId: number, id: number) => ({
  id,
  categoryId,
  categoryName: `Category ${categoryId}`,
});

// Five Pathani (category 1) and ten Jodhpuri (category 2), newest first.
const pathani = [15, 14, 13, 12, 11].map((id) => design(1, id));
const jodhpuri = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((id) => design(2, id));
const designs = [...pathani, ...jodhpuri];

describe('showroomSlides', () => {
  it('takes turns between categories, the longest finishing alone', () => {
    expect(showroomSlides(designs, [1, 2]).map((slide) => slide.id)).toEqual([
      15, 10, 14, 9, 13, 8, 12, 7, 11, 6, 5, 4, 3, 2, 1,
    ]);
  });

  it('starts on the newest design of the first category with any', () => {
    expect(showroomSlides(designs, [1, 2])[0].id).toBe(15);
    expect(showroomSlides(designs, [2])[0].id).toBe(10);
  });

  it('shows only the categories chosen', () => {
    const slides = showroomSlides(designs, [2]);
    expect(slides).toHaveLength(10);
    expect(slides.every((slide) => slide.categoryId === 2)).toBe(true);
  });

  it('shows nothing when nothing is chosen', () => {
    expect(showroomSlides(designs, [])).toEqual([]);
    expect(showroomSlides([], [1])).toEqual([]);
  });
});

describe('showroomCategories', () => {
  it('counts each category, in the order they come', () => {
    expect(showroomCategories(designs)).toEqual([
      { id: 1, name: 'Category 1', count: 5 },
      { id: 2, name: 'Category 2', count: 10 },
    ]);
  });
});

describe('showroomSlideMs', () => {
  it('gives a design with more photos longer, up to the three shown', () => {
    expect(showroomSlideMs(1)).toBe(5000);
    expect(showroomSlideMs(2)).toBe(5000);
    expect(showroomSlideMs(3)).toBe(7500);
    expect(showroomSlideMs(9)).toBe(7500);
  });
});

describe('designNameSize', () => {
  it('sets a long name smaller, and larger on a screen on its side', () => {
    expect(designNameSize('Royal Jodhpuri Suit', false)).toBeGreaterThan(
      designNameSize('Classic Black Bandhgala With Golden Buttons', false)
    );
    expect(designNameSize('Royal Jodhpuri Suit', true)).toBeGreaterThan(
      designNameSize('Royal Jodhpuri Suit', false)
    );
  });
});

describe('isFullPin', () => {
  it('takes four digits and nothing else', () => {
    expect(isFullPin('1234')).toBe(true);
    expect(isFullPin('123')).toBe(false);
    expect(isFullPin('12345')).toBe(false);
    expect(isFullPin('12a4')).toBe(false);
    expect(isFullPin('')).toBe(false);
  });
});

describe('photoFadeStarts', () => {
  it('holds the first photo for its share before the first fade', () => {
    expect(photoFadeStarts(7500, 3, 900)).toEqual([1600, 4100]);
    expect(photoFadeStarts(5000, 2, 900)).toEqual([1600]);
  });

  it('has nothing to fade to with one photo, or none', () => {
    expect(photoFadeStarts(5000, 1, 900)).toEqual([]);
    expect(photoFadeStarts(5000, 0, 900)).toEqual([]);
  });
});
