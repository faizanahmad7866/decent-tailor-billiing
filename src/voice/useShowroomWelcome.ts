import { useEffect } from 'react';
import { SHOWROOM_WELCOME_LINES } from './spokenText';
import { speakAlways, stopSpeaking } from './voice';
import { createWelcome } from './welcome';

/** The pause after the greeting before the catalogue is introduced. */
const PAUSE_MS = 3000;
/** How long after the welcome ends it is said again, while the showroom runs. */
const REPEAT_MS = 60_000;

/**
 * Greets the customer as the showroom opens, when the tailor switched its voice
 * on at setup, and again a minute after each welcome ends, for whoever walks up
 * next. It follows that switch alone, not Settings → Voice, which is for
 * the meters and discount on a bill. Leaving the showroom silences it at once.
 */
export function useShowroomWelcome(on: boolean): void {
  useEffect(() => {
    if (!on) return;
    const welcome = createWelcome(SHOWROOM_WELCOME_LINES, speakAlways, {
      pauseMs: PAUSE_MS,
      repeatMs: REPEAT_MS,
    });
    welcome.start();
    return () => {
      welcome.cancel();
      stopSpeaking();
    };
  }, [on]);
}
