import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CARD, COLORS, GUTTER, RADIUS, TYPE } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { clothRepo, type Cloth } from '../../repositories/clothRepo';
import { searchCloths } from '../../utils/clothSearch';
import { formatRupees } from '../../utils/money';
import { addCountLabel, toggleSelected } from '../../utils/selection';
import { HEADER_HEIGHT } from '../AppHeader';
import { Button } from '../Button';
import { ClothNames } from '../ClothNames';
import { ClothPrice } from '../ClothPrice';
import { ClothThumb } from '../ClothThumb';
import { EmptyState } from '../EmptyState';
import { Footer } from '../Footer';
import { IconButton } from '../IconButton';
import { SearchField } from '../SearchField';
import { Tap } from '../Tap';

const PICKER_MAX_WIDTH = 640;

interface ClothPickerProps {
  visible: boolean;
  onClose: () => void;
  /** The cloths chosen, in the order they were tapped. */
  onConfirm: (cloths: Cloth[]) => void;
  /** The catalog is empty and the tailor wants to add a cloth now. */
  onAddCloth: () => void;
}

/**
 * The cloth catalog as a full-screen list to pick cloths from. Tap as many as
 * the bill needs — searching in between keeps what was already ticked — then
 * add them all at once.
 */
export const ClothPicker: React.FC<ClothPickerProps> = ({
  visible,
  onClose,
  onConfirm,
  onAddCloth,
}) => {
  const insets = useSafeAreaInsets();
  const [cloths, setCloths] = useState<Cloth[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Read afresh on every open, so a cloth added a moment ago is there.
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setQuery('');
    setSelectedIds([]);
    setLoadFailed(false);
    clothRepo.list().then(
      (list) => {
        if (active) setCloths(list);
      },
      () => {
        if (active) setLoadFailed(true);
      }
    );
    return () => {
      active = false;
    };
  }, [visible]);

  const visibleCloths = useMemo(
    () => searchCloths(cloths ?? [], query),
    [cloths, query]
  );

  const confirm = (): void => {
    const byId = new Map((cloths ?? []).map((cloth) => [cloth.id, cloth]));
    onConfirm(
      selectedIds.flatMap((id) => {
        const cloth = byId.get(id);
        return cloth ? [cloth] : [];
      })
    );
  };

  const renderBody = (): React.ReactNode => {
    if (loadFailed) {
      return (
        <EmptyState
          icon="cloud-offline-outline"
          title={t("Couldn't open the catalog")}
          message={t('Close this and try again.')}
        />
      );
    }
    if (!cloths) {
      return <ActivityIndicator color={COLORS.accent} style={styles.loading} />;
    }
    if (cloths.length === 0) {
      return (
        <EmptyState
          icon="layers-outline"
          title={t('No cloths in your catalog')}
          message={t(
            'Add a cloth with its price per meter, then pick it here.'
          )}
          action={{ label: t('Add cloth'), onPress: onAddCloth }}
        />
      );
    }
    return (
      <FlatList
        data={visibleCloths}
        keyExtractor={(cloth) => String(cloth.id)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.search}>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder={t('Search name or price, e.g. 1200')}
            />
            <Text style={styles.hint}>
              {t('Tap to select — you can pick several cloths at once')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.noMatch}>
            {t('No cloth matches “{0}”', query.trim())}
          </Text>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        extraData={selectedIds}
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          return (
            <Tap
              onPress={() =>
                setSelectedIds((ids) => toggleSelected(ids, item.id))
              }
              haptic="select"
              throttle={false}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={t(
                '{0}, {1} per meter',
                item.name,
                formatRupees(item.pricePerMeterPaise)
              )}
              style={[styles.row, selected && styles.rowSelected]}
            >
              <ClothThumb
                name={item.name}
                imageName={item.imageName}
                style={styles.thumb}
              />
              <View style={styles.rowText}>
                <ClothNames
                  title={item.name}
                  name={item.name}
                  hindi={item.nameHindi}
                  size={18}
                />
                <ClothPrice paise={item.pricePerMeterPaise} size={19} />
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={30}
                color={selected ? COLORS.accent : COLORS.borderStrong}
              />
            </Tap>
          );
        }}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* The header runs up under the status bar, like every other page. */}
      <View style={styles.page}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <Text accessibilityRole="header" style={styles.title}>
              {selectedIds.length
                ? t('{0} selected', selectedIds.length)
                : t('Select cloths')}
            </Text>
            <IconButton
              icon="close"
              label={t('Close')}
              color={COLORS.textPrimary}
              onPress={onClose}
            />
          </View>
        </View>
        {renderBody()}
        {cloths && cloths.length > 0 ? (
          <Footer maxWidth={PICKER_MAX_WIDTH}>
            <Button
              label={
                selectedIds.length
                  ? addCountLabel(selectedIds.length, 'cloth')
                  : t('Select a cloth')
              }
              icon="checkmark"
              onPress={confirm}
              disabled={selectedIds.length === 0}
            />
          </Footer>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = themedStyles(() => ({
  page: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    width: '100%',
    maxWidth: PICKER_MAX_WIDTH,
    alignSelf: 'center',
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: GUTTER,
    paddingRight: GUTTER - 8,
  },
  title: { ...TYPE.heading, fontSize: 19, color: COLORS.textPrimary },
  loading: { flex: 1 },
  list: {
    width: '100%',
    maxWidth: PICKER_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: GUTTER,
    paddingBottom: 24,
  },
  search: { paddingTop: 16, paddingBottom: 12, gap: 10 },
  hint: { ...TYPE.caption, color: COLORS.textSecondary, marginLeft: 4 },
  noMatch: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  separator: { height: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 8,
    paddingRight: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    ...CARD,
  },
  // The border thickens when ticked; the padding gives the pixel back, so
  // the row doesn't shift.
  rowSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 7,
    paddingRight: 11,
    backgroundColor: COLORS.primaryTint,
  },
  thumb: { width: 68, height: 68, borderRadius: RADIUS.sm },
  rowText: { flex: 1, gap: 4 },
}));
