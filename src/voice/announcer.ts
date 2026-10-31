/**
 * Says a line once the figure behind it has stopped changing: typing "2.5"
 * is "2" and then "2.5", and only the last is worth saying. A line is not
 * repeated straight after itself, so a "5." typed after "5" stays quiet.
 */
export interface Announcer {
  /** Say `text` after the pause; null cancels whatever was waiting. */
  say: (text: string | null) => void;
  cancel: () => void;
}

export function createAnnouncer(
  speak: (text: string) => void,
  delayMs: number
): Announcer {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last: string | null = null;

  const cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
  };

  return {
    cancel,
    say: (text) => {
      cancel();
      if (!text) {
        // The figure was cleared: the same one typed again is new.
        last = null;
        return;
      }
      if (text === last) return;
      timer = setTimeout(() => {
        timer = undefined;
        last = text;
        speak(text);
      }, delayMs);
    },
  };
}
