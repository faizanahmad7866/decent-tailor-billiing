/**
 * The showroom's welcome: its lines said one after another, with a pause after
 * each has been said in full — measured from the end of a line, not its start,
 * since how long a phone's voice takes to say one is its own. Cancelling drops
 * whatever was still to come, including a line whose end is reported late.
 */
export interface Welcome {
  start: () => void;
  cancel: () => void;
}

export function createWelcome(
  lines: readonly string[],
  say: (text: string, onDone: () => void) => void,
  pauseMs: number
): Welcome {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  const sayFrom = (at: number): void => {
    if (cancelled || at >= lines.length) return;
    say(lines[at], () => {
      if (cancelled || at + 1 >= lines.length) return;
      timer = setTimeout(() => {
        timer = undefined;
        sayFrom(at + 1);
      }, pauseMs);
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
