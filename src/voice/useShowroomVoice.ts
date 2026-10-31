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
 * offer as its poster comes up. It follows that switch alone, not Settings →
 * Voice, which is for the meters and discount on a bill. Leaving the showroom
 * silences it at once. The slides never wait for it.
 */
export function useShowroomVoice(on: boolean): {
  announce: (text: string) => void;
} {
  const narrator = useRef<Narrator | null>(null);

  useEffect(() => {
    if (!on) return;
    const created = createNarrator(SHOWROOM_WELCOME_LINES, speakAlways, {
      pauseMs: PAUSE_MS,
      repeatMs: REPEAT_MS,
    });
    narrator.current = created;
    created.start();
    return () => {
      created.cancel();
      narrator.current = null;
      stopSpeaking();
    };
  }, [on]);

  const announce = useRef((text: string) => narrator.current?.announce(text));
  return { announce: announce.current };
}
