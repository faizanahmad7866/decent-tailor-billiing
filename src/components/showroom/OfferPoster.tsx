import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Easing,
  ReduceMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FONT, SERIF, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';
import { shownDate } from '../../i18n/dates';
import { t } from '../../i18n/t';
import { daysLeft, offerTitleSize, type Offer } from '../../utils/offers';
import { Eyebrow } from './Eyebrow';
import { Reveal } from './Reveal';
import { showroomType } from './showroomType';

const BUILD_MS = 1400;

/** "Last day today", "Only 1 day left", "Only 5 days left". */
export const offerUrgency = (endsAt: string): string => {
  const days = daysLeft(endsAt);
  if (days <= 0) return t('Last day today');
  return days === 1 ? t('Only 1 day left') : t('Only {0} days left', days);
};

interface OfferPosterProps {
  offer: Offer;
  /** The room it has, to size its line to. */
  width: number;
  height: number;
  /** Builds up when it comes on screen. */
  active?: boolean;
}

/**
 * An offer as a fashion house would print it: set in type, on the dark, with one
 * line very large and nothing else asking for attention — the occasion above it,
 * what it is on below, and until when. No badge, no burst, no glow: the offer is
 * the figure.
 */
export const OfferPoster: React.FC<OfferPosterProps> = ({
  offer,
  width,
  height,
  active = true,
}) => {
  const build = useSharedValue(0);

  useEffect(() => {
    build.value = active
      ? withTiming(1, {
          duration: BUILD_MS,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        })
      : 0;
  }, [active, build]);

  const occasion = offer.occasion.trim() || t('Special offer');
  const size = offerTitleSize(offer.title, width, height);

  return (
    <View
      accessibilityLabel={[occasion, offer.title, offer.note]
        .filter(Boolean)
        .join(', ')}
      style={styles.poster}
    >
      <Reveal build={build} from={0} to={0.35} rise={0}>
        <View style={styles.seal}>
          <Ionicons
            name={`${offer.icon}-outline` as const}
            size={22}
            color={SHOWROOM.gold}
          />
        </View>
      </Reveal>
      <Reveal build={build} from={0.08} to={0.45}>
        <Eyebrow style={styles.occasion}>{occasion}</Eyebrow>
      </Reveal>
      <Reveal build={build} from={0.18} to={0.7} rise={18}>
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={[
            showroomType.display,
            styles.title,
            { fontSize: size, lineHeight: size * 1.05 },
          ]}
        >
          {offer.title}
        </Text>
      </Reveal>
      {offer.note.trim() ? (
        <Reveal build={build} from={0.4} to={0.85}>
          <Text numberOfLines={2} style={styles.note}>
            {offer.note}
          </Text>
        </Reveal>
      ) : null}
      <Reveal build={build} from={0.55} to={1} rise={0}>
        <View style={styles.rule} />
      </Reveal>
      <Reveal build={build} from={0.6} to={1}>
        <Text style={styles.until}>
          {t('Till {0}', shownDate(offer.endsAt))}
          <Text style={styles.dot}>{'   ·   '}</Text>
          <Text style={styles.urgency}>{offerUrgency(offer.endsAt)}</Text>
        </Text>
      </Reveal>
      <Reveal build={build} from={0.7} to={1}>
        <Text style={showroomType.caption}>{t('Ask at the counter')}</Text>
      </Reveal>
    </View>
  );
};

const styles = themedStyles(() => ({
  poster: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  seal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: SHOWROOM.goldDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  occasion: { fontSize: 13 },
  title: { textAlign: 'center', fontFamily: SERIF.semibold },
  note: {
    fontFamily: FONT.regular,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    color: SHOWROOM.textMuted,
  },
  rule: {
    width: 48,
    height: 1,
    marginVertical: 6,
    backgroundColor: SHOWROOM.goldDeep,
  },
  until: {
    fontFamily: FONT.medium,
    fontSize: 15,
    textAlign: 'center',
    color: SHOWROOM.text,
  },
  dot: { color: SHOWROOM.textFaint },
  urgency: { color: SHOWROOM.gold },
}));
