import { useEffect, useRef } from 'react';
import { createAnnouncer, type Announcer } from './announcer';
import { speak } from './voice';

/** How long a figure must stand still before it is read out. */
const PAUSE_MS = 700;

/**
 * An announcer for one input, for the life of its screen: call `say` from the
 * input's change handler. What was still waiting is dropped when the screen
 * goes away.
 */
export function useAnnouncer(): Announcer {
  const announcer = useRef<Announcer | null>(null);
  if (!announcer.current) announcer.current = createAnnouncer(speak, PAUSE_MS);
  useEffect(() => () => announcer.current?.cancel(), []);
  return announcer.current;
}
