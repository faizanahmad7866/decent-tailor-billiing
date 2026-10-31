import React, { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import { TextField } from '../components/TextField';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { usePagePadding } from '../layout/Page';
import { FORM_MAX_WIDTH } from '../layout/useLayout';
import type { RootScreenProps } from '../navigation/types';
import { deleteAllData, loadDataSummary } from '../storage/dataService';
import {
  isEmptySummary,
  summaryLine,
  type DataSummary,
} from '../utils/dataSummary';
import { haptics } from '../utils/haptics';

// Typed out before the button works, so a delete is never a slip of the thumb.
const CONFIRM_WORD = 'DELETE';

/**
 * Settings → Delete all data. Says what will go (counted, so it can be
 * checked), points at Backup first, and only enables the button once the
 * word DELETE is typed.
 */
export const DeleteDataScreen: React.FC<RootScreenProps<'DeleteData'>> = ({
  navigation,
}) => {
  const pagePadding = usePagePadding();
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
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
  }, []);

  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;
  const empty = summary !== null && isEmptySummary(summary);

  const handleDelete = async (): Promise<void> => {
    if (!confirmed || deleting) return;
    setDeleting(true);
    try {
      await deleteAllData();
      haptics.success();
      // Back to the bills, so every page is read afresh from what is left.
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      Alert.alert(
        t('All data deleted'),
        t('Bills, cloths, designs and photos were removed.')
      );
    } catch {
      haptics.error();
      setDeleting(false);
      Alert.alert(
        t('Not deleted'),
        t('Something went wrong, so nothing was changed. Try again.')
      );
    }
  };

  return (
    <KeyboardAwareScroll
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={pagePadding}
    >
      <View style={styles.column}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.badge}>
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
            </View>
            <Text style={styles.cardTitle}>{t('Delete all data')}</Text>
          </View>
          <Text style={styles.cardBody}>
            {t(
              'Removes every bill, cloth, design, photo and video from this phone, and the bill numbers start again from 1.'
            )}{' '}
            <Text style={styles.strong}>{t('This cannot be undone.')}</Text>
          </Text>

          <View style={styles.counts}>
            <Text style={styles.countsLabel}>{t('On this phone now')}</Text>
            <Text style={styles.countsLine}>
              {summary ? summaryLine(summary) : t('Counting…')}
            </Text>
          </View>

          <Text style={styles.kept}>
            {t(
              "Kept: the Rate Master, the catalogue's categories, and the printer, voice, language and dark mode settings."
            )}
          </Text>
        </View>

        <View style={styles.tip}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={COLORS.success}
          />
          <View style={styles.tipBody}>
            <Text style={styles.tipText}>
              {t(
                'Make a backup first if you may want this data again — it carries the photos and videos too.'
              )}
            </Text>
            <Button
              label={t('Create backup first')}
              icon="cloud-upload-outline"
              variant="secondary"
              onPress={() => navigation.navigate('Backup')}
              disabled={deleting}
            />
          </View>
        </View>

        {empty ? (
          <Text style={styles.nothing}>{t('There is nothing to delete.')}</Text>
        ) : (
          <View style={styles.card}>
            <TextField
              label={t('Type {0} to confirm', CONFIRM_WORD)}
              placeholder={CONFIRM_WORD}
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!deleting}
              returnKeyType="done"
            />
            <Button
              label={t('Delete everything')}
              icon="trash-outline"
              variant="danger"
              onPress={() => void handleDelete()}
              loading={deleting}
              disabled={!confirmed || summary === null}
            />
          </View>
        )}
      </View>
    </KeyboardAwareScroll>
  );
};

const styles = themedStyles(() => ({
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
    backgroundColor: COLORS.dangerTint,
  },
  cardTitle: { ...TYPE.heading, color: COLORS.textPrimary },
  cardBody: { ...TYPE.body, lineHeight: 22, color: COLORS.textSecondary },
  strong: { ...TYPE.bodyStrong, color: COLORS.danger },
  counts: {
    gap: 4,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  countsLabel: { ...TYPE.caption, color: COLORS.textSecondary },
  countsLine: { ...TYPE.bodyStrong, color: COLORS.textPrimary },
  kept: { ...TYPE.caption, lineHeight: 18, color: COLORS.textSecondary },
  tip: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.successTint,
  },
  tipBody: { flex: 1, gap: 12 },
  tipText: {
    ...TYPE.caption,
    lineHeight: 18,
    color: COLORS.textPrimary,
  },
  nothing: {
    ...TYPE.body,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
}));
