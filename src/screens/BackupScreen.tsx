import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { Button } from '../components/Button';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { usePagePadding } from '../layout/Page';
import { FORM_MAX_WIDTH } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import {
  exportBackup,
  InvalidBackupError,
  pickBackupFile,
  restoreBackup,
} from '../storage/backupService';
import { loadDataSummary } from '../storage/dataService';
import { summaryLine, type DataSummary } from '../utils/dataSummary';
import { haptics } from '../utils/haptics';

type Busy = 'backup' | 'restore' | null;

export const BackupScreen: React.FC<RootScreenProps<'Backup'>> = ({
  navigation,
}) => {
  const pagePadding = usePagePadding();
  const [busy, setBusy] = useState<Busy>(null);
  // What the backup will carry, counted afresh each time the page is shown.
  const [summary, setSummary] = useState<DataSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadDataSummary().then(
        (loaded) => {
          if (active) setSummary(loaded);
        },
        () => {}
      );
      return () => {
        active = false;
      };
    }, [])
  );

  const handleBackup = async (): Promise<void> => {
    setBusy('backup');
    try {
      const uri = await exportBackup();
      await Sharing.shareAsync(uri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Save DT Billing backup',
      });
    } catch {
      haptics.error();
      Alert.alert(
        t('Backup not made'),
        t('Something went wrong while making the backup. Try again.')
      );
    } finally {
      setBusy(null);
    }
  };

  const restore = async (uri: string): Promise<void> => {
    setBusy('restore');
    try {
      await restoreBackup(uri);
      haptics.success();
      // Back to the bills, so every page is read afresh from what was
      // restored — no need to close and reopen the app.
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      Alert.alert(t('Restore complete'), t('Your backup has been restored.'));
    } catch {
      haptics.error();
      setBusy(null);
      Alert.alert(
        t('Restore failed'),
        t('Your current data has not been changed. Try again.')
      );
    }
  };

  const handleRestore = async (): Promise<void> => {
    let uri: string | null;
    try {
      uri = await pickBackupFile();
    } catch (error) {
      haptics.error();
      Alert.alert(
        t('Not a backup file'),
        error instanceof InvalidBackupError
          ? t('Pick a file made with "Create backup" in DT Billing.')
          : t('That file could not be opened. Try again.')
      );
      return;
    }
    if (!uri) return;

    const picked = uri;
    Alert.alert(
      t('Replace all data?'),
      t(
        'Every bill, cloth, rate, design, photo and video on this phone will be replaced by the backup. This cannot be undone.'
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Replace all data'),
          style: 'destructive',
          onPress: () => restore(picked),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={pagePadding}>
      <View style={styles.column}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.badge}>
              <Ionicons
                name="cloud-upload-outline"
                size={22}
                color={COLORS.accent}
              />
            </View>
            <Text style={styles.cardTitle}>{t('Back up')}</Text>
          </View>
          <Text style={styles.cardBody}>
            {t(
              'One file with all your bills, cloths, rates, designs, and every photo and video. Save it to Google Drive or send it to yourself on WhatsApp.'
            )}
          </Text>
          <View style={styles.contents}>
            <Text style={styles.contentsLabel}>
              {t('This backup will carry')}
            </Text>
            <Text style={styles.contentsLine}>
              {summary ? summaryLine(summary) : t('Counting…')}
            </Text>
          </View>
          <Button
            label={t('Create backup')}
            icon="download-outline"
            onPress={handleBackup}
            loading={busy === 'backup'}
            disabled={busy !== null}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={[styles.badge, styles.badgeDanger]}>
              <Ionicons
                name="cloud-download-outline"
                size={22}
                color={COLORS.danger}
              />
            </View>
            <Text style={styles.cardTitle}>{t('Restore')}</Text>
          </View>
          <Text style={styles.cardBody}>
            {t(
              'Bring back data from a backup file — on a new phone, or after the app was reinstalled. It replaces everything on this phone.'
            )}
          </Text>
          <Button
            label={t('Restore from file')}
            icon="folder-open-outline"
            variant="secondary"
            onPress={handleRestore}
            loading={busy === 'restore'}
            disabled={busy !== null}
          />
        </View>

        <View style={styles.tip}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={COLORS.success}
          />
          <Text style={styles.tipText}>
            {t(
              'Make a backup at least once a week. If this phone is lost or broken, the backup is the only copy of your bills.'
            )}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  column: {
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    gap: 16,
  },
  card: {
    padding: 18,
    gap: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...CARD,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryTint,
  },
  badgeDanger: { backgroundColor: COLORS.dangerTint },
  cardTitle: { ...TYPE.heading, color: COLORS.textPrimary },
  cardBody: { ...TYPE.body, lineHeight: 22, color: COLORS.textSecondary },
  contents: {
    gap: 4,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  contentsLabel: { ...TYPE.caption, color: COLORS.textSecondary },
  contentsLine: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  tip: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.successTint,
  },
  tipText: {
    ...TYPE.caption,
    flex: 1,
    lineHeight: 18,
    color: COLORS.textPrimary,
  },
}));
