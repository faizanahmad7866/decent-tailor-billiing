import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { FONT, SERIF, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { t } from '../../i18n/t';
import { clothPhotoUri } from '../../storage/clothImageStore';
import { initialOf } from '../../utils/avatar';
import { formatMeters } from '../../utils/billMath';
import { formatRupees } from '../../utils/money';
import type { FabricLine, FabricOption } from '../../utils/showroomPricing';
import { Tap } from '../Tap';
import { Eyebrow } from './Eyebrow';
import { showroomType } from './showroomType';

/** A cloth's photo as a small round swatch, or its initial where it has none. */
const Swatch: React.FC<{ name: string; imageName: string | null }> = ({
  name,
  imageName,
}) => {
  const uri = imageName ? clothPhotoUri(imageName) : null;
  return (
    <View style={styles.swatch}>
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Text style={styles.initial}>{initialOf(name)}</Text>
      )}
    </View>
  );
};

interface FabricChooserProps {
  lines: FabricLine[];
  /** The key chosen on each line; none keeps the tailor's own. */
  chosen: (string | undefined)[];
  onChoose: (line: number, key: string) => void;
  showPrice: boolean;
}

/**
 * The cloths a design is made in, each with the types it can be had in — Classic,
 * Royal, Signature — to choose among, its rate per meter beside each where prices
 * are shown. The tailor's own choice is marked, and is chosen until another is.
 */
export const FabricChooser: React.FC<FabricChooserProps> = ({
  lines,
  chosen,
  onChoose,
  showPrice,
}) => {
  if (!lines.length) return null;
  const choosing = lines.some((line) => line.options.length > 1);
  return (
    <View style={styles.block}>
      <Eyebrow>{choosing ? t('Choose the fabric') : t('Fabric')}</Eyebrow>
      {lines.map((line, at) => {
        const current =
          line.options.find((option) => option.key === chosen[at]) ??
          line.options.find((option) => option.own) ??
          line.options[0];
        return (
          <View key={at} style={styles.line}>
            <View style={styles.cloth}>
              <Swatch
                name={line.cloth.clothName}
                imageName={current.imageName}
              />
              <View style={styles.clothWords}>
                <Text numberOfLines={1} style={styles.clothName}>
                  {line.cloth.clothName}
                </Text>
                <Text numberOfLines={1} style={showroomType.caption}>
                  {[line.cloth.nameHindi, formatMeters(line.cloth.lengthCm)]
                    .filter(Boolean)
                    .join('  ·  ')}
                </Text>
              </View>
            </View>
            {line.options.length > 1 ? (
              <View style={styles.options}>
                {line.options.map((option) => (
                  <OptionChip
                    key={option.key}
                    option={option}
                    fallback={line.cloth.clothName}
                    selected={option.key === current.key}
                    showPrice={showPrice}
                    onPress={() => onChoose(at, option.key)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const OptionChip: React.FC<{
  option: FabricOption;
  fallback: string;
  selected: boolean;
  showPrice: boolean;
  onPress: () => void;
}> = ({ option, fallback, selected, showPrice, onPress }) => (
  <Tap
    onPress={onPress}
    haptic="select"
    throttle={false}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    style={[styles.chip, selected && styles.chipSelected]}
  >
    <Text
      numberOfLines={1}
      style={[styles.chipName, selected && styles.chipNameSelected]}
    >
      {option.name || fallback}
    </Text>
    {showPrice ? (
      <Text style={styles.chipRate}>
        {t('{0} / m', formatRupees(option.ratePaise))}
      </Text>
    ) : null}
    {option.own ? <Text style={styles.chipOwn}>{t('As shown')}</Text> : null}
  </Tap>
);

const styles = themedStyles(() => ({
  block: { gap: 18 },
  line: { gap: 12 },
  cloth: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clothWords: { flex: 1, minWidth: 0, gap: 2 },
  clothName: { fontFamily: FONT.medium, fontSize: 15, color: SHOWROOM.text },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SHOWROOM.lineStrong,
    backgroundColor: SHOWROOM.surfaceRaised,
  },
  initial: { fontFamily: SERIF.semibold, fontSize: 20, color: SHOWROOM.gold },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    minWidth: 112,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
    borderWidth: 1,
    borderColor: SHOWROOM.line,
    borderRadius: 2,
  },
  chipSelected: {
    borderColor: SHOWROOM.gold,
    backgroundColor: SHOWROOM.surfaceRaised,
  },
  chipName: {
    fontFamily: FONT.medium,
    fontSize: 14,
    color: SHOWROOM.textMuted,
  },
  chipNameSelected: { color: SHOWROOM.text },
  chipRate: {
    fontFamily: FONT.regular,
    fontSize: 12.5,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.gold,
  },
  chipOwn: {
    fontFamily: FONT.regular,
    fontSize: 11,
    color: SHOWROOM.textFaint,
  },
}));
