import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tap } from '../components/Tap';
import { COLORS, FONT } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { NAV_RAIL_WIDTH } from '../layout/useLayout';
import { TabIcon, type IconName } from './TabIcon';
import type { TabParamList } from './types';

export interface TabDefinition {
  name: keyof TabParamList;
  active: IconName;
  idle: IconName;
}

interface NavRailProps {
  tabs: readonly TabDefinition[];
  /** The tab the page on screen belongs to. */
  current: keyof TabParamList;
  onSelect: (tab: keyof TabParamList) => void;
}

/**
 * A tablet's navigation: the tabs in a rail down the right edge, where the
 * hand holding the tablet can reach them, instead of a bar stretched across
 * ten inches with four icons lost in it. It stays on every page, not only the
 * tabs' own, so the tailor is never more than one tap from anywhere.
 */
export const NavRail: React.FC<NavRailProps> = ({
  tabs,
  current,
  onSelect,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.rail,
        {
          // It owns the right edge, so it takes any inset there (a camera
          // cutout with the tablet on its side) by growing into it.
          width: NAV_RAIL_WIDTH + insets.right,
          paddingRight: insets.right,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {tabs.map((tab) => {
        const focused = tab.name === current;
        return (
          <Tap
            key={tab.name}
            onPress={() => onSelect(tab.name)}
            haptic="select"
            throttle={false}
            activeOpacity={1}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t(tab.name)}
            style={styles.item}
          >
            <TabIcon
              focused={focused}
              name={focused ? tab.active : tab.idle}
              color={focused ? COLORS.textPrimary : COLORS.textSecondary}
            />
            <Text style={[styles.label, focused && styles.labelFocused]}>
              {t(tab.name)}
            </Text>
          </Tap>
        );
      })}
    </View>
  );
};

const styles = themedStyles(() => ({
  rail: {
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  item: {
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  labelFocused: { color: COLORS.textPrimary },
}));
