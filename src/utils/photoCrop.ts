// The part of a photo to keep. It is held as shares of the photo, from 0 to 1, not
// pixels: the box on screen, the photo as picked and the photo as saved are all
// different sizes, and shares mean the same on each. Worked out here, apart from the
// screen, so it can be tested.

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const WHOLE_PHOTO: CropBox = { x: 0, y: 0, width: 1, height: 1 };

/** The smallest part that can be kept: anything less is not a photo of the design. */
export const MIN_CROP = 0.15;

/** What a finger has hold of: the box to move it, or one of its sides or corners. */
export type CropGrab =
  'move' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), high);

/**
 * What a touch at (x, y), in pixels on the photo as shown, has hold of. A side can be
 * taken up to `reach` pixels from its line, which is far wider than the line drawn, so
 * a thumb can find it. Inside the box that reach stops at a third of the way across,
 * so even the smallest box still has a middle to move it by. Null is a touch outside.
 */
export function cropGrabAt(
  box: CropBox,
  shownWidth: number,
  shownHeight: number,
  x: number,
  y: number,
  reach: number
): CropGrab | null {
  const left = box.x * shownWidth;
  const right = (box.x + box.width) * shownWidth;
  const top = box.y * shownHeight;
  const bottom = (box.y + box.height) * shownHeight;

  const within =
    x >= left - reach &&
    x <= right + reach &&
    y >= top - reach &&
    y <= bottom + reach;
  if (!within) return null;

  const across = Math.min(reach, (right - left) / 3);
  const down = Math.min(reach, (bottom - top) / 3);
  const side = x <= left + across ? 'w' : x >= right - across ? 'e' : '';
  const end = y <= top + down ? 'n' : y >= bottom - down ? 's' : '';
  return (end + side || 'move') as CropGrab;
}

/**
 * The box after a drag of (dx, dy), as shares of the photo, from how it was when the
 * finger came down. Moving keeps its size and stays on the photo. Pulling a side
 * stops at the photo's edge, and at the smallest part that can be kept.
 */
export function dragCrop(
  start: CropBox,
  grab: CropGrab,
  dx: number,
  dy: number
): CropBox {
  if (grab === 'move') {
    return {
      ...start,
      x: clamp(start.x + dx, 0, 1 - start.width),
      y: clamp(start.y + dy, 0, 1 - start.height),
    };
  }

  let left = start.x;
  let right = start.x + start.width;
  let top = start.y;
  let bottom = start.y + start.height;

  if (grab.includes('w')) left = clamp(left + dx, 0, right - MIN_CROP);
  if (grab.includes('e')) right = clamp(right + dx, left + MIN_CROP, 1);
  if (grab.includes('n')) top = clamp(top + dy, 0, bottom - MIN_CROP);
  if (grab.includes('s')) bottom = clamp(bottom + dy, top + MIN_CROP, 1);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** Whether the box is the photo as it is: nothing to cut, so nothing to do. */
export const isWholePhoto = (box: CropBox): boolean =>
  box.width >= 0.995 && box.height >= 0.995;

/** The box in whole pixels of a photo of this size, never past its edge. */
export function cropToPixels(
  box: CropBox,
  imageWidth: number,
  imageHeight: number
): { originX: number; originY: number; width: number; height: number } {
  const originX = clamp(Math.round(box.x * imageWidth), 0, imageWidth - 1);
  const originY = clamp(Math.round(box.y * imageHeight), 0, imageHeight - 1);
  return {
    originX,
    originY,
    width: clamp(Math.round(box.width * imageWidth), 1, imageWidth - originX),
    height: clamp(
      Math.round(box.height * imageHeight),
      1,
      imageHeight - originY
    ),
  };
}

/** Where a photo sits, whole and centred, in an area: its size and its offset. */
export function fitPhoto(
  areaWidth: number,
  areaHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const scale = Math.min(areaWidth / imageWidth, areaHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (areaWidth - width) / 2,
    y: (areaHeight - height) / 2,
    width,
    height,
  };
}
