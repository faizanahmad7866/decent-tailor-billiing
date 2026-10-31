import { useEffect } from 'react';
import { SHOWROOM_WELCOME_LINES } from './spokenText';
import { speakAlways, stopSpeaking } from './voice';
import { createWelcome } from './welcome';

/** The pause after the greeting before the catalogue is introduced. */
const PAUSE_MS = 3000;

/**
 * Greets the customer as the showroom opens, when the tailor switched its voice
 * on at setup. It follows that switch alone, not Settings → Voice, which is for
 * the meters and discount on a bill. Leaving the showroom silences it at once.
 */
export function useShowroomWelcome(on: boolean): void {
  useEffect(() => {
    if (!on) return;
    const welcome = createWelcome(
      SHOWROOM_WELCOME_LINES,
      speakAlways,
      PAUSE_MS
    );
    welcome.start();
    return () => {
      welcome.cancel();
      stopSpeaking();
    };
  }, [on]);
}
