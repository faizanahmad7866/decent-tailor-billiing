import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { ClothQrPanel } from '../components/cloth/ClothQrPanel';
import { ClothQrSheet } from '../components/cloth/ClothQrSheet';
import { ClothTypeRow } from '../components/cloth/ClothTypeRow';
import { ClothTypeSheet } from '../components/cloth/ClothTypeSheet';
import { ClothNames } from '../components/ClothNames';
import { ClothPrice } from '../components/ClothPrice';
import { ClothThumb } from '../components/ClothThumb';
import { HeaderAction } from '../components/HeaderAction';
import { NoteBlock } from '../components/NoteBlock';
import { Section } from '../components/Section';
import { CARD, COLORS, RADIUS, TYPE } from '../constants/theme';
import { themedStyles } from '../constants/themedStyles';
import { t } from '../i18n/t';
import { PageColumn, PageColumns, usePagePadding } from '../layout/Page';
import type { RootScreenProps } from '../navigation/types';
import { clothRepo, type Cloth } from '../repositories/clothRepo';
import {
  clothTypeRepo,
  type ClothType,
  type ClothTypeDraft,
} from '../repositories/clothTypeRepo';
import { haptics } from '../utils/haptics';

/**
 * One cloth, as a record of it: its photo, name, price per meter and note; the
 * types it comes in, each with its own rate and photo, to add to and change; and
 * its QR label. A cloth with no types has one QR, shown here. One with types has
 * several, so it asks which first. Bills are made on New bill, not from here.
 * Opened by tapping a cloth in the catalog, by scanning its label, and right
 * after a new cloth is saved (`justAdded`).
 */
export const ClothDetailScreen: React.FC<RootScreenProps<'ClothDetail'>> = ({
  navigation,
  route,
}) => {
  const pagePadding = usePagePadding();
  const { clothId, justAdded = false } = route.params;
  const [cloth, setCloth] = useState<Cloth | null>(null);
  const [types, setTypes] = useState<ClothType[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  // The type sheet: null closed, no type for a new one.
  const [editing, setEditing] = useState<{ type?: ClothType } | null>(null);
  // The QR sheet: null closed, and the type it opens straight on, if any.
  const [qr, setQr] = useState<{ type: ClothType | null } | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderAction
          label={t('Edit')}
          icon="create-outline"
          onPress={() => navigation.navigate('ClothForm', { clothId })}
        />
      ),
    });
  }, [navigation, clothId]);

  const reloadTypes = useCallback(async (): Promise<void> => {
    setTypes(await clothTypeRepo.list(clothId));
  }, [clothId]);

  // Read again on return from Edit, so a new name or price shows at once. A
  // cloth deleted from there is gone: back to the catalog.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([clothRepo.get(clothId), clothTypeRepo.list(clothId)]).then(
        ([loaded, loadedTypes]) => {
          if (!active) return;
          if (!loaded) {
            navigation.goBack();
            return;
          }
          setCloth(loaded);
          setTypes(loadedTypes);
        },
        () => {
          if (active) setLoadFailed(true);
        }
      );
      return () => {
        active = false;
      };
    }, [clothId, navigation])
  );

  if (!cloth) {
    return (
      <View style={styles.page}>
        {loadFailed ? (
          <Text style={styles.failed}>
            {t("Couldn't open this cloth. Go back and try again.")}
          </Text>
        ) : (
          <ActivityIndicator color={COLORS.accent} style={styles.loading} />
        )}
      </View>
    );
  }

  const choosePrinter = (): void => {
    setQr(null);
    navigation.navigate('PrinterSettings');
  };

  const saveType = async (draft: ClothTypeDraft): Promise<void> => {
    try {
      if (draft.id === undefined) await clothTypeRepo.add(cloth.id, draft);
      else await clothTypeRepo.update(draft.id, draft);
      haptics.success();
      setEditing(null);
      await reloadTypes();
    } catch {
      haptics.error();
      Alert.alert(t('Not saved'), t('The type could not be saved. Try again.'));
    }
  };

  const removeType = async (): Promise<void> => {
    const id = editing?.type?.id;
    if (id === undefined) return;
    try {
      await clothTypeRepo.remove(id);
      haptics.success();
      setEditing(null);
      await reloadTypes();
    } catch {
      haptics.error();
      Alert.alert(
        t('Not deleted'),
        t('The type could not be deleted. Try again.')
      );
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={pagePadding}>
        <PageColumn wide>
          <PageColumns
            first={
              <>
                {justAdded ? (
                  <View style={styles.saved}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.success}
                    />
                    <Text style={styles.savedText}>
                      {t(
                        'Cloth saved. Print its QR label now, or later from here.'
                      )}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.card}>
                  <View style={styles.top}>
                    <ClothThumb
                      name={cloth.name}
                      imageName={cloth.imageName}
                      style={styles.thumb}
                    />
                    <View style={styles.names}>
                      <ClothNames
                        title={cloth.name}
                        name={cloth.name}
                        hindi={cloth.nameHindi}
                        size={19}
                      />
                      <ClothPrice paise={cloth.pricePerMeterPaise} size={19} />
                    </View>
                  </View>
                </View>

                <NoteBlock note={cloth.note} saved={cloth.noteHindi} />

                <Section
                  title={t('Types · प्रकार')}
                  aside={
                    types.length ? (
                      <Text style={styles.typeCount}>
                        {types.length === 1
                          ? t('1 type')
                          : t('{0} types', types.length)}
                      </Text>
                    ) : null
                  }
                  description={
                    types.length
                      ? t('Each with its own rate, chosen on the bill')
                      : t(
                          'Optional. Add them if this cloth comes in types with their own rate'
                        )
                  }
                >
                  {types.map((type) => (
                    <ClothTypeRow
                      key={type.id}
                      name={type.name}
                      pricePerMeterPaise={type.pricePerMeterPaise}
                      imageName={type.imageName}
                      onEdit={() => setEditing({ type })}
                      onQr={() => setQr({ type })}
                    />
                  ))}
                  <Button
                    label={t('Add type')}
                    icon="add"
                    variant="secondary"
                    onPress={() => setEditing({})}
                  />
                </Section>
              </>
            }
            second={
              <Section title={t('QR label')}>
                {types.length ? (
                  <>
                    <Text style={styles.qrNote}>
                      {t(
                        'This cloth has types, so it has more than one QR: one for the whole cloth, and one for each type.'
                      )}
                    </Text>
                    <Button
                      label={t('Create QR')}
                      icon="qr-code-outline"
                      onPress={() => setQr({ type: null })}
                    />
                  </>
                ) : (
                  <ClothQrPanel
                    cloth={cloth}
                    type={null}
                    onChoosePrinter={choosePrinter}
                  />
                )}
              </Section>
            }
          />
        </PageColumn>
      </ScrollView>

      <ClothTypeSheet
        visible={editing !== null}
        editing={editing?.type ?? null}
        otherNames={types
          .filter((type) => type.id !== editing?.type?.id)
          .map((type) => type.name)}
        startPricePaise={cloth.pricePerMeterPaise}
        onSave={(draft) => void saveType(draft)}
        onDelete={() => void removeType()}
        onClose={() => setEditing(null)}
      />
      <ClothQrSheet
        visible={qr !== null}
        cloth={cloth}
        types={types}
        startType={qr?.type ?? null}
        onChoosePrinter={choosePrinter}
        onClose={() => setQr(null)}
      />
    </View>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1 },
  failed: {
    ...TYPE.body,
    textAlign: 'center',
    color: COLORS.textSecondary,
    margin: 40,
  },
  saved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.successTint,
  },
  savedText: { ...TYPE.label, flex: 1, color: COLORS.textPrimary },
  card: {
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...CARD,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 84, height: 84, borderRadius: RADIUS.md },
  names: { flex: 1, gap: 8 },
  typeCount: { ...TYPE.label, color: COLORS.textPrimary },
  qrNote: { ...TYPE.body, fontSize: 14, color: COLORS.textSecondary },
}));
