import { FONT, FONT_LIGHT, SERIF, SHOWROOM } from '../../constants/theme';
import { themedStyles } from '../../constants/themedStyles';

/**
 * The showroom's type, in one place: the serif for a design's name and the few
 * words set large, Inter for everything read rather than looked at. A screen of
 * the showroom picks from these and at most sets a size.
 */
export const showroomType = themedStyles(() => ({
  // Small capitals over a heading: the category, the section. Spaced only where it
  // is not Hindi (see Eyebrow).
  eyebrow: {
    fontFamily: FONT.medium,
    fontSize: 11,
    textTransform: 'uppercase',
    color: SHOWROOM.gold,
  },
  // Lining figures: the Garamond's own sit low, and "10% off" would read "Io%".
  display: {
    fontFamily: SERIF.semibold,
    fontVariant: ['lining-nums'],
    color: SHOWROOM.text,
  },
  displayItalic: { fontFamily: SERIF.italic, color: SHOWROOM.text },
  hindi: { fontFamily: FONT.regular, fontSize: 15, color: SHOWROOM.textMuted },
  body: {
    fontFamily: FONT.regular,
    fontSize: 15,
    lineHeight: 22,
    color: SHOWROOM.textMuted,
  },
  label: { fontFamily: FONT.medium, fontSize: 14, color: SHOWROOM.text },
  caption: {
    fontFamily: FONT.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: SHOWROOM.textFaint,
  },
  // A figure set large: light and in columns, as on a price tag.
  figure: {
    fontFamily: FONT_LIGHT,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.text,
  },
  amount: {
    fontFamily: FONT.medium,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    color: SHOWROOM.text,
  },
}));
