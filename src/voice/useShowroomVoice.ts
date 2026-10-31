import { useEffect, useRef } from 'react';
import { createNarrator, type Narrator } from './narrator';
import { SHOWROOM_WELCOME_LINES } from './spokenText';
import { speakAlways, stopSpeaking } from './voice';

/** The pause after the greeting before the catalogue is introduced. */
const PAUSE_MS = 3000;
/** How long after the welcome ends it is said again, while the showroom runs. */
const REPEAT_MS = 120_000;

/**
 * The showroom's voice, when the tailor switched it on at setup: the welcome as
 * it opens and again 2 minutes after each welcome ends, and `announce` for an
 * offer as its poster comes up. It is `held` while a customer explores the
 * designs themselves, so it never talks over someone reading a price. It follows
 * the setup switch alone, not Settings → Voice, which is for the meters and
 * discount on a bill. Leaving the showroom silences it at once.
 */
export function useShowroomVoice(
  on: boolean,
  held: boolean
): { announce: (text: string) => void } {
  const narrator = useRef<Narrator | null>(null);
  const heldNow = useRef(held);
  heldNow.current = held;

  useEffect(() => {
    if (!on) return;
    const created = createNarrator(SHOWROOM_WELCOME_LINES, speakAlways, {
      pauseMs: PAUSE_MS,
      repeatMs: REPEAT_MS,
    });
    narrator.current = created;
    created.hold(heldNow.current);
    created.start();
    return () => {
      created.cancel();
      narrator.current = null;
      stopSpeaking();
    };
  }, [on]);

  useEffect(() => {
    narrator.current?.hold(held);
  }, [held]);

  const announce = useRef((text: string) => narrator.current?.announce(text));
  return { announce: announce.current };
}
