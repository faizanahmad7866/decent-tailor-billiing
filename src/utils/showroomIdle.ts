// The showroom's idle clock, as a kiosk keeps one: a customer who stops touching
// the screen is asked whether they are still looking, with the seconds left
// counted down, and if no one answers the showroom starts over for whoever comes
// next. Any touch puts the clock back to the start.

export interface IdleTiming {
  /** From the last touch to starting over. */
  idleMs: number;
  /** The last part of that, during which the question is shown. */
  warnMs: number;
}

export interface IdleEvents {
  /** The seconds left while the question is shown; null once it is answered. */
  onWarn: (secondsLeft: number | null) => void;
  onTimeout: () => void;
}

export interface IdleClock {
  /** A touch: back to the start, and the question put away. */
  poke: () => void;
  stop: () => void;
}

const SECOND_MS = 1000;

export function createIdleClock(
  { idleMs, warnMs }: IdleTiming,
  { onWarn, onTimeout }: IdleEvents
): IdleClock {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let warning = false;
  let stopped = false;

  const countDown = (secondsLeft: number): void => {
    if (secondsLeft <= 0) {
      warning = false;
      stopped = true;
      onTimeout();
      return;
    }
    onWarn(secondsLeft);
    timer = setTimeout(() => countDown(secondsLeft - 1), SECOND_MS);
  };

  const start = (): void => {
    clearTimeout(timer);
    timer = setTimeout(
      () => {
        warning = true;
        countDown(Math.ceil(warnMs / SECOND_MS));
      },
      Math.max(idleMs - warnMs, 0)
    );
  };

  start();

  return {
    poke: () => {
      if (stopped) return;
      if (warning) {
        warning = false;
        onWarn(null);
      }
      start();
    },
    stop: () => {
      stopped = true;
      clearTimeout(timer);
      timer = undefined;
      if (warning) {
        warning = false;
        onWarn(null);
      }
    },
  };
}
