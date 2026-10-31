import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Hero } from '../components/Hero';
import { Tap } from '../components/Tap';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { PageColumn, PageColumns, usePagePadding } from '../layout/Page';
import type { TabScreenProps } from '../navigation/types';
import {
  setDarkMode,
  setLanguage,
  useAppSettings,
} from '../settings/appSettings';
import { setVoiceEnabled, useVoiceEnabled } from '../voice/voice';

const logo = require('../../assets/brand/logo-gold.png');
const logoSource = Image.resolveAssetSource(logo);
const LOGO_HEIGHT = 64;

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  /** A row that removes something: its icon and title are red. */
  danger?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}) => (
  <Tap onPress={onPress} accessibilityLabel={title} style={styles.row}>
    <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
      <Ionicons
        name={icon}
        size={20}
        color={danger ? COLORS.danger : COLORS.accent}
      />
    </View>
    <View style={styles.rowText}>
      <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>
        {title}
      </Text>
      <Text style={styles.rowSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
  </Tap>
);

interface SwitchRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (on: boolean) => void;
}

const SwitchRow: React.FC<SwitchRowProps> = ({
  icon,
  title,
  subtitle,
  value,
  onChange,
}) => (
  <View style={styles.row}>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={20} color={COLORS.accent} />
    </View>
    <View style={styles.rowText}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSubtitle}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{
        false: COLORS.borderStrong,
        true: COLORS.primary,
      }}
      thumbColor="#FFFFFF"
      accessibilityLabel={title}
    />
  </View>
);

// Grouped by what the tailor came to do, so the page is scanned, not read.
export const SettingsScreen: React.FC<TabScreenProps<'Settings'>> = ({
  navigation,
}) => {
  const voice = useVoiceEnabled();
  const { darkMode, language } = useAppSettings();
  const pagePadding = usePagePadding();
  return (
    <ScrollView style={styles.page} contentContainerStyle={pagePadding}>
      <PageColumn wide>
        <PageColumns
          first={
            <>
              <Hero style={styles.brand}>
                <Image
                  source={logo}
                  resizeMode="contain"
                  accessibilityLabel={t('Decent Tailor')}
                  style={{
                    height: LOGO_HEIGHT,
                    width: (LOGO_HEIGHT * logoSource.width) / logoSource.height,
                  }}
                />
                <Text style={styles.brandName}>{t('DT Billing')}</Text>
                <Text style={styles.brandNote}>
                  {t('Cloth & stitching bills')}
                </Text>
              </Hero>

              <View style={styles.group}>
                <Text style={styles.groupTitle}>{t('Business')}</Text>
                <View style={styles.panel}>
                  <SettingsRow
                    icon="bar-chart-outline"
                    title={t('Analytics')}
                    subtitle={t('Which cloth sold how much, and the total')}
                    onPress={() => navigation.navigate('Analytics')}
                  />
                  <View style={styles.divider} />
                  <SettingsRow
                    icon="pricetag-outline"
                    title={t('Rate Master')}
                    subtitle={t('Making charge for each garment')}
                    onPress={() => navigation.navigate('RateMaster')}
                  />
                  <View style={styles.divider} />
                  <SettingsRow
                    icon="print-outline"
                    title={t('Bluetooth Printer')}
                    subtitle={t('Choose the 58 mm printer, print a test page')}
                    onPress={() => navigation.navigate('PrinterSettings')}
                  />
                </View>
              </View>
            </>
          }
          second={
            <>
              <View style={styles.group}>
                <Text style={styles.groupTitle}>{t('App')}</Text>
                <View style={styles.panel}>
                  <SwitchRow
                    icon="language-outline"
                    title={t('Hindi · हिंदी')}
                    subtitle={t(
                      'Shows the whole app in Hindi. Bills and PDFs for customers stay as they are.'
                    )}
                    value={language === 'hi'}
                    onChange={(on) => setLanguage(on ? 'hi' : 'en')}
                  />
                  <View style={styles.divider} />
                  <SwitchRow
                    icon={darkMode ? 'moon' : 'moon-outline'}
                    title={t('Dark mode · डार्क मोड')}
                    subtitle={t(
                      'A dark screen, easier on the eyes in low light'
                    )}
                    value={darkMode}
                    onChange={setDarkMode}
                  />
                  <View style={styles.divider} />
                  <SwitchRow
                    icon={voice ? 'volume-high' : 'volume-mute-outline'}
                    title={t('Voice · आवाज़')}
                    subtitle={t(
                      'Says the meters and the discount aloud, like “5 मीटर”, “10 परसेंट डिस्काउंट”'
                    )}
                    value={voice}
                    onChange={setVoiceEnabled}
                  />
                </View>
              </View>

              <View style={styles.group}>
                <Text style={styles.groupTitle}>{t('Data')}</Text>
                <View style={styles.panel}>
                  <SettingsRow
                    icon="cloud-upload-outline"
                    title={t('Backup & Restore')}
                    subtitle={t(
                      'Save all your data to one file, or bring it back'
                    )}
                    onPress={() => navigation.navigate('Backup')}
                  />
                  <View style={styles.divider} />
                  <SettingsRow
                    icon="trash-outline"
                    title={t('Delete all data')}
                    subtitle={t(
                      'Remove every bill, cloth, design and photo from this phone'
                    )}
                    danger
                    onPress={() => navigation.navigate('DeleteData')}
                  />
                </View>
              </View>
            </>
          }
        />
      </PageColumn>
    </ScrollView>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  brand: { alignItems: 'center', paddingVertical: 20 },
  brandName: { ...TYPE.heading, color: COLORS.textPrimary, marginTop: 10 },
  brandNote: { ...TYPE.caption, color: COLORS.textSecondary, marginTop: 2 },
  group: { gap: 8 },
  groupTitle: { ...TYPE.overline, color: COLORS.textSecondary, marginLeft: 4 },
  panel: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...CARD,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
  },
  rowIconDanger: { backgroundColor: COLORS.dangerTint },
  rowTitleDanger: { color: COLORS.danger },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
    backgroundColor: COLORS.border,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  rowSubtitle: { ...TYPE.caption, color: COLORS.textSecondary },
}));
