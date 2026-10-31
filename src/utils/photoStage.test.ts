import {
  photoAt,
  placeFromFront,
  poseAt,
  settleOn,
  tipFor,
  turnFor,
} from './photoStage';

describe('placeFromFront', () => {
  it('goes round in a ring with three photos', () => {
    expect(placeFromFront(0, 0, 3)).toBe(0);
    expect(placeFromFront(1, 0, 3)).toBe(1);
    // The last stands to the left of the first.
    expect(placeFromFront(2, 0, 3)).toBe(-1);
    expect(placeFromFront(0, 1, 3)).toBe(-1);
  });

  it('keeps working after going round more than once, either way', () => {
    expect(placeFromFront(0, 3, 3)).toBe(0);
    expect(placeFromFront(1, -3, 3)).toBe(1);
    expect(placeFromFront(2, -1, 3)).toBe(0);
  });

  it('stands two photos side by side, with no ring', () => {
    expect(placeFromFront(1, 0, 2)).toBe(1);
    expect(placeFromFront(0, 1, 2)).toBe(-1);
  });
});

describe('poseAt', () => {
  it('stands the front photo flat and full size', () => {
    const front = poseAt(0, 300);
    expect(front.translateX).toBe(0);
    expect(Math.abs(front.rotateY)).toBe(0);
    expect(front.scale).toBe(1);
    expect(front.opacity).toBe(1);
  });

  it('turns the side photos in towards the front, smaller and behind it', () => {
    const right = poseAt(1, 300);
    const left = poseAt(-1, 300);
    expect(right.translateX).toBeGreaterThan(0);
    expect(left.translateX).toBeLessThan(0);
    expect(right.rotateY).toBeLessThan(0);
    expect(left.rotateY).toBeGreaterThan(0);
    expect(right.scale).toBeLessThan(1);
    expect(right.zIndex).toBeLessThan(poseAt(0, 300).zIndex);
  });

  it('hides a photo at the back of the ring, where it changes sides', () => {
    expect(poseAt(1.5, 300).opacity).toBe(0);
    expect(poseAt(-1.5, 300).opacity).toBe(0);
    expect(poseAt(1, 300).opacity).toBe(1);
  });
});

describe('turnFor and tipFor', () => {
  it('follow the finger, and stop before a flat photo stops reading as one', () => {
    expect(turnFor(100, 1000)).toBeCloseTo(7);
    expect(turnFor(5000, 1000)).toBe(42);
    expect(turnFor(-5000, 1000)).toBe(-42);
    expect(tipFor(5000, 1000)).toBe(-18);
    expect(tipFor(-5000, 1000)).toBe(18);
  });
});

describe('settleOn', () => {
  it('stays for a small slow drag', () => {
    expect(settleOn(1, -20, 0, 300, 3)).toBe(1);
  });

  it('moves one photo for a long drag or a flick, whichever way', () => {
    expect(settleOn(1, -120, 0, 300, 3)).toBe(2);
    expect(settleOn(1, 120, 0, 300, 3)).toBe(0);
    expect(settleOn(1, -10, -1, 300, 3)).toBe(2);
  });

  it('goes round the ring with three, but stops at the ends of two', () => {
    expect(settleOn(2, -120, 0, 300, 3)).toBe(3);
    expect(settleOn(1, -120, 0, 300, 2)).toBe(1);
    expect(settleOn(0, 120, 0, 300, 2)).toBe(0);
  });
});

describe('photoAt', () => {
  it('names the photo at any position round the ring', () => {
    expect(photoAt(3, 3)).toBe(0);
    expect(photoAt(4, 3)).toBe(1);
    expect(photoAt(-1, 3)).toBe(2);
    expect(photoAt(1.4, 3)).toBe(1);
  });
});
