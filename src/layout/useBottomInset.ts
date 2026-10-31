import { useContext } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from './useLayout';

/**
 * Room a page has to leave at its foot for the system navigation bar.
 *
 * The app draws edge to edge, so the window runs on underneath the gesture
 * handle or the three buttons. A page in a phone's tabs stands on the tab bar,
 * which already pads itself by that much, so this is 0 there. Every other page
 * — and every page on a tablet, whose tabs are in the rail — runs to the bottom
 * of the glass and takes the inset itself.
 *
 * Add it where the bottom actually is: a scroll view's end padding, a sticky
 * footer's own padding, a floating button's offset.
 */
export function useBottomInset(): number {
  const { isTablet } = useLayout();
  const { bottom } = useSafeAreaInsets();
  const onTabBar = useContext(BottomTabBarHeightContext) !== undefined;
  return onTabBar && !isTablet ? 0 : bottom;
}
