// The arithmetic of the 3D photo stage: where each photo stands as the stage is
// turned. `progress` is the photo in front, as a position that can be between
// two photos while a finger is turning it.

/** How far a photo beside the front one is turned away, in degrees. */
const SIDE_ANGLE = 52;
/** How much smaller a photo is for each place it stands from the front. */
const SHRINK_PER_PLACE = 0.2;
/** How far a whole drag across the stage turns a lone photo, in degrees. */
const LONE_PHOTO_TURN = 70;
/** The most a lone photo turns: past this, a flat photo stops reading as one. */
const MAX_TURN = 42;
/** The most a photo tips towards or away from the customer. */
const MAX_TIP = 18;
/** A drag this fraction of a card's width moves on to the next photo. */
const STEP_THRESHOLD = 0.25;

/**
 * Where photo `index` stands from the front: 0 in front, 1 the next to its
 * right, −1 to its left. Three or more photos go round in a ring, so the last
 * stands to the left of the first; two simply sit side by side.
 */
export function placeFromFront(
  index: number,
  progress: number,
  count: number
): number {
  'worklet';
  const raw = index - progress;
  if (count < 3) return raw;
  const half = count / 2;
  return ((((raw + half) % count) + count) % count) - half;
}

export interface StagePose {
  translateX: number;
  rotateY: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

/** How a photo stands at `place`, on a stage whose cards are `cardWidth` wide. */
export function poseAt(place: number, cardWidth: number): StagePose {
  'worklet';
  const distance = Math.abs(place);
  return {
    translateX: place * cardWidth * 0.8,
    rotateY: -place * SIDE_ANGLE,
    scale: Math.max(1 - distance * SHRINK_PER_PLACE, 0.5),
    // Gone before it reaches the back of the ring, where it changes sides.
    opacity: Math.min(Math.max(1 - (distance - 1) * 2, 0), 1),
    zIndex: Math.round(100 - distance * 10),
  };
}

/** How far a lone photo turns for a drag of `dx` across a stage `width` wide. */
export function turnFor(dx: number, width: number): number {
  const turn = (dx / Math.max(width, 1)) * LONE_PHOTO_TURN;
  return Math.min(Math.max(turn, -MAX_TURN), MAX_TURN);
}

/** How far a photo tips for a drag of `dy` down a stage `height` tall. */
export function tipFor(dy: number, height: number): number {
  const tip = (-dy / Math.max(height, 1)) * MAX_TIP * 2;
  return Math.min(Math.max(tip, -MAX_TIP), MAX_TIP);
}

/**
 * The photo to settle on when the finger lifts: the next one for a long enough
 * drag or a quick flick, one at a time, stopping at the ends of a row of two.
 */
export function settleOn(
  startIndex: number,
  dx: number,
  velocityX: number,
  cardWidth: number,
  count: number
): number {
  const flicked = Math.abs(velocityX) > 0.4;
  const far = Math.abs(dx) > cardWidth * STEP_THRESHOLD;
  if (!flicked && !far) return startIndex;
  const step = (flicked ? velocityX : dx) < 0 ? 1 : -1;
  const next = startIndex + step;
  return count < 3 ? Math.min(Math.max(next, 0), count - 1) : next;
}

/** A stage position, however far it has gone round, as the photo it shows. */
export function photoAt(position: number, count: number): number {
  return ((Math.round(position) % count) + count) % count;
}
