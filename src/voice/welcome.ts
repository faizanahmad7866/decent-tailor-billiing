/**
 * The showroom's welcome: its lines said one after another, with a pause after
 * each has been said in full — measured from the end of a line, not its start,
 * since how long a phone's voice takes to say one is its own. With `repeatMs`,
 * the whole welcome comes round again that long after its last line ends, for
 * as long as the showroom runs, so one round never runs into the next.
 * Cancelling drops whatever was still to come, including a line whose end is
 * reported late.
 */
export interface Welcome {
  start: () => void;
  cancel: () => void;
}

export interface WelcomeTiming {
  /** After each line but the last. */
  pauseMs: number;
  /** After the last line, before the welcome is said again; none says it once. */
  repeatMs?: number;
}

export function createWelcome(
  lines: readonly string[],
  say: (text: string, onDone: () => void) => void,
  { pauseMs, repeatMs }: WelcomeTiming
): Welcome {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  const after = (ms: number, then: () => void): void => {
    timer = setTimeout(() => {
      timer = undefined;
      then();
    }, ms);
  };

  const sayFrom = (at: number): void => {
    if (cancelled || at >= lines.length) return;
    say(lines[at], () => {
      if (cancelled) return;
      if (at + 1 < lines.length) after(pauseMs, () => sayFrom(at + 1));
      else if (repeatMs !== undefined) after(repeatMs, () => sayFrom(0));
    });
  };

  return {
    start: () => {
      cancelled = false;
      clearTimeout(timer);
      sayFrom(0);
    },
    cancel: () => {
      cancelled = true;
      clearTimeout(timer);
      timer = undefined;
    },
  };
}
