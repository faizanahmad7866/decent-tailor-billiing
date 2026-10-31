import {
  cropGrabAt,
  cropToPixels,
  dragCrop,
  fitPhoto,
  isWholePhoto,
  MIN_CROP,
  WHOLE_PHOTO,
  type CropBox,
} from './photoCrop';

const box: CropBox = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };

describe('cropGrabAt', () => {
  // On a photo shown 100 x 100: the box runs from 20 to 80 each way.
  const at = (x: number, y: number) => cropGrabAt(box, 100, 100, x, y, 5);

  it('takes hold of a corner', () => {
    expect(at(20, 20)).toBe('nw');
    expect(at(80, 20)).toBe('ne');
    expect(at(20, 80)).toBe('sw');
    expect(at(80, 80)).toBe('se');
  });

  it('takes hold of a side', () => {
    expect(at(50, 20)).toBe('n');
    expect(at(50, 80)).toBe('s');
    expect(at(20, 50)).toBe('w');
    expect(at(80, 50)).toBe('e');
  });

  it('moves the box from inside it, and has nothing outside it', () => {
    expect(at(50, 50)).toBe('move');
    expect(at(5, 5)).toBeNull();
  });

  it('keeps a middle to move the smallest box by', () => {
    const small: CropBox = { x: 0.4, y: 0.4, width: 0.2, height: 0.2 };
    expect(cropGrabAt(small, 100, 100, 50, 50, 30)).toBe('move');
    expect(cropGrabAt(small, 100, 100, 44, 50, 30)).toBe('w');
    expect(cropGrabAt(small, 100, 100, 56, 50, 30)).toBe('e');
    expect(cropGrabAt(small, 100, 100, 44, 44, 30)).toBe('nw');
  });

  it('still reaches a side from just outside the box', () => {
    expect(at(16, 50)).toBe('w');
    expect(at(84, 84)).toBe('se');
  });
});

describe('dragCrop', () => {
  it('moves the box whole, and stops at the edge of the photo', () => {
    expect(dragCrop(box, 'move', 0.1, -0.1)).toEqual({
      ...box,
      x: 0.30000000000000004,
      y: 0.1,
    });
    const far = dragCrop(box, 'move', 5, 5);
    expect(far.x + far.width).toBeCloseTo(1);
    expect(far.y + far.height).toBeCloseTo(1);
    expect(far.width).toBe(box.width);
  });

  it('pulls one corner, leaving the opposite one where it was', () => {
    const pulled = dragCrop(box, 'se', 0.1, 0.1);
    expect(pulled.x).toBe(box.x);
    expect(pulled.y).toBe(box.y);
    expect(pulled.width).toBeCloseTo(0.7);
    expect(pulled.height).toBeCloseTo(0.7);

    const other = dragCrop(box, 'nw', 0.1, 0.1);
    expect(other.x + other.width).toBeCloseTo(0.8);
    expect(other.y + other.height).toBeCloseTo(0.8);
  });

  it('pulls a side one way only', () => {
    const pulled = dragCrop(box, 'e', 0.1, 0.4);
    expect(pulled.width).toBeCloseTo(0.7);
    expect(pulled.height).toBeCloseTo(box.height);
  });

  it('stops at the edge of the photo', () => {
    expect(dragCrop(box, 'w', -5, 0).x).toBe(0);
    const right = dragCrop(box, 'e', 5, 0);
    expect(right.x + right.width).toBe(1);
  });

  it('never goes below the smallest part, however far it is pulled', () => {
    const squeezed = dragCrop(box, 'se', -5, -5);
    expect(squeezed.width).toBeCloseTo(MIN_CROP);
    expect(squeezed.height).toBeCloseTo(MIN_CROP);
    expect(squeezed.x).toBe(box.x);
    const other = dragCrop(box, 'nw', 5, 5);
    expect(other.width).toBeCloseTo(MIN_CROP);
    expect(other.x + other.width).toBeCloseTo(0.8);
  });
});

describe('isWholePhoto', () => {
  it('tells the whole photo from a part of it', () => {
    expect(isWholePhoto(WHOLE_PHOTO)).toBe(true);
    expect(isWholePhoto(box)).toBe(false);
    expect(isWholePhoto({ x: 0, y: 0, width: 1, height: 0.9 })).toBe(false);
  });
});

describe('cropToPixels', () => {
  it('turns shares into whole pixels of this photo', () => {
    expect(cropToPixels(box, 1000, 2000)).toEqual({
      originX: 200,
      originY: 400,
      width: 600,
      height: 1200,
    });
  });

  it('never runs past the edge, whatever the rounding does', () => {
    const edge = cropToPixels(
      { x: 0.3333, y: 0.3333, width: 0.6667, height: 0.6667 },
      1001,
      1001
    );
    expect(edge.originX + edge.width).toBeLessThanOrEqual(1001);
    expect(edge.originY + edge.height).toBeLessThanOrEqual(1001);
  });
});

describe('fitPhoto', () => {
  it('fits an upright photo by its height, centred across', () => {
    expect(fitPhoto(400, 800, 1000, 4000)).toEqual({
      x: 100,
      y: 0,
      width: 200,
      height: 800,
    });
  });

  it('fits a wide photo by its width, centred down', () => {
    expect(fitPhoto(400, 800, 2000, 1000)).toEqual({
      x: 0,
      y: 300,
      width: 400,
      height: 200,
    });
  });
});
