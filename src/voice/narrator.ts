/**
 * The showroom's one voice: the welcome, said on a loop, and an offer read out
 * when its poster comes up. One voice, so they take turns rather than talk over
 * each other:
 *
 * - The welcome's lines follow one another with a pause after each has been said
 *   in full (measured from its end: how long a line takes is the phone's own),
 *   and the whole welcome comes round again `repeatMs` after its last line ends.
 * - An offer is about what is on the screen right now, so it cuts in. A welcome
 *   line it cuts off is said again, whole, a pause after the offer ends; one that
 *   falls due while an offer is being read waits for it the same way.
 * - Held while a customer is exploring the showroom themselves: what is being said
 *   is finished, nothing new is begun, and no offer is read. A welcome line that
 *   fell due meanwhile is said a pause after the hold is let go.
 * - Cancelling drops everything still to come, including an end reported late.
 */
export interface Narrator {
  start: () => void;
  announce: (text: string) => void;
  hold: (on: boolean) => void;
  cancel: () => void;
}

export interface NarratorTiming {
  /** After each welcome line but the last, and after an offer that held one up. */
  pauseMs: number;
  /** After the welcome's last line, before it is said again; none says it once. */
  repeatMs?: number;
}

/** Says `text`, then calls `onEnd` once it is over, whether said in full or cut off. */
export type Say = (text: string, onEnd: () => void) => void;

export function createNarrator(
  lines: readonly string[],
  speak: Say,
  { pauseMs, repeatMs }: NarratorTiming
): Narrator {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;
  // Which line is being said; the end of an older, cut-off one is ignored.
  let utterance = 0;
  let speaking: 'welcome' | 'offer' | null = null;
  let next = 0;
  // A welcome line waiting for an offer, or the hold, to end.
  let due = false;
  let held = false;

  const after = (ms: number, then: () => void): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      then();
    }, ms);
  };

  const say = (
    kind: 'welcome' | 'offer',
    text: string,
    onEnd: () => void
  ): void => {
    utterance += 1;
    const id = utterance;
    speaking = kind;
    speak(text, () => {
      if (cancelled || id !== utterance) return;
      speaking = null;
      onEnd();
    });
  };

  const welcome = (): void => {
    if (cancelled || !lines.length) return;
    if (speaking || held) {
      due = true;
      return;
    }
    say('welcome', lines[next], () => {
      next += 1;
      if (next < lines.length) {
        after(pauseMs, welcome);
        return;
      }
      next = 0;
      if (repeatMs !== undefined) after(repeatMs, welcome);
    });
  };

  return {
    start: () => {
      cancelled = false;
      next = 0;
      due = held;
      welcome();
    },
    announce: (text) => {
      if (cancelled || !text) return;
      if (speaking === 'welcome') due = true;
      if (held) return;
      say('offer', text, () => {
        if (!due || held) return;
        due = false;
        after(pauseMs, welcome);
      });
    },
    hold: (on) => {
      if (on === held) return;
      held = on;
      if (held || cancelled || speaking || !due) return;
      due = false;
      after(pauseMs, welcome);
    },
    cancel: () => {
      cancelled = true;
      utterance += 1;
      speaking = null;
      clearTimeout(timer);
      timer = undefined;
    },
  };
}
