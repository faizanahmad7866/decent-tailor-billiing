import { LayoutAnimation } from 'react-native';

/**
 * Makes the next change to the layout glide instead of jump: a line added to
 * a bill eases in and the ones below slide down, rather than snapping. Call
 * it just before the state change that adds or removes the row.
 */
export function animateNextLayout(): void {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}
