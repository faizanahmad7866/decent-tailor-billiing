import React from 'react';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, tracking } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { useLayout } from '../layout/useLayout';
import { Tap } from './Tap';

const logo = require('../../assets/brand/logo-gold.png');
const logoSource = Image.resolveAssetSource(logo);
const logoWidthFor = (height: number): number =>
  (height * logoSource.width) / logoSource.height;

export const HEADER_HEIGHT = 56;
/** A top app bar on a large screen is taller than a phone's. */
const TABLET_HEADER_HEIGHT = 64;

interface AppHeaderProps {
  title: string;
  /** The shop's logo in place of the title — for the app's first screens. */
  brand?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}

/**
 * The one header every screen renders: a light bar with one hairline rule
 * under it, the gold logo on the app's main pages and the page's name and a
 * back arrow everywhere else — the main Decent Tailor app's own. It owns the
 * status-bar inset, so no screen has to think about notches.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  brand = false,
  onBack,
  right,
}) => {
  const insets = useSafeAreaInsets();
  const { isTablet, gutter } = useLayout();
  const logoHeight = isTablet ? 46 : 41;

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View
        style={[
          styles.row,
          {
            height: isTablet ? TABLET_HEADER_HEIGHT : HEADER_HEIGHT,
            paddingHorizontal: gutter,
          },
        ]}
      >
        {onBack ? (
          <Tap
            onPress={onBack}
            accessibilityLabel={t('Go back')}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Tap>
        ) : null}

        <View style={styles.titleSlot}>
          {brand ? (
            <Image
              source={logo}
              resizeMode="contain"
              accessible
              accessibilityRole="header"
              accessibilityLabel={t('Decent Tailor')}
              style={{ width: logoWidthFor(logoHeight), height: logoHeight }}
            />
          ) : (
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              style={[styles.title, isTablet && styles.titleTablet]}
            >
              {title}
            </Text>
          )}
        </View>

        {right ? <View style={styles.actions}>{right}</View> : null}
      </View>
    </View>
  );
};

const styles = themedStyles(() => ({
  bar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  back: {
    width: 44,
    height: 44,
    // The target reaches past the content edge so the arrow itself, not its
    // invisible hit area, lines up with the content below.
    marginLeft: -10,
    marginRight: 6,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSlot: { flex: 1 },
  title: {
    fontFamily: FONT.bold,
    fontSize: 19,
    letterSpacing: tracking(-0.2),
    color: COLORS.textPrimary,
  },
  titleTablet: { fontSize: 21 },
  actions: { flexDirection: 'row', alignItems: 'center' },
}));
