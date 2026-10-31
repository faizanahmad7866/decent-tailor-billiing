import type { TextStyle, ViewStyle } from 'react-native';

// The one place the app's look is defined. Screens read colors, type, shape
// and shadow from here, never as raw values, so a change is one edit.
//
// The look of billing software, kept plain on purpose: a light grey page, white
// surfaces held by a one-pixel border, dark neutral text, tight corners, and
// figures in straight columns. The main Decent Tailor app's yellow appears only
// where the tailor acts or has chosen — the main button, a selected option, the
// field being typed in — so it always means something; it is a fill or a border,
// never text, and what is written on it is `onPrimary`. Money status has its own
// colours, used as words rather than badges: green is paid, orange is still due.
//
// Dark mode is the same look with its own values, DARK below, chosen in
// Settings. Dark swaps the values inside COLORS, CARD and INITIAL_TILE, and
// themedStyles rebuilds every style sheet from them, so a screen just reads
// COLORS as it always has.

const LIGHT = {
  // The soft charcoal of the camera screen and the full-screen photo view.
  ink: '#2A2C33',

  // Actions: buttons, the active chip, focus, the floating button. Always a
  // fill or a border; what is written on it is `onPrimary`.
  primary: '#FFCE1B',
  primaryPressed: '#DDAD00',
  // The quiet ground of a secondary control: grey, not a pale yellow.
  primaryTint: '#F3F4F6',
  primaryTintStrong: '#E5E7EB',
  // Lighter still: the inside of the field being typed in.
  primaryWash: '#FFFFFF',
  // Text and icons on a `primary` fill.
  onPrimary: '#1F2937',
  // A small badge on a `primary` fill, such as a count.
  onPrimaryTile: 'rgba(31, 41, 55, 0.12)',
  // Icons and emphasised text on a light surface.
  accent: '#374151',

  // The logo's gold — accents only (highlights, the logo itself). Text in
  // gold uses goldText, dark enough to read on white.
  gold: '#C69B47',
  goldText: '#8F6A1E',
  goldTint: '#F9FAFB',
  // The warm mat a design's photo sits on, as on the PDF catalogue's pages.
  ivory: '#F7F2E8',

  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceSunken: '#F3F4F6',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // On the ink screens.
  textOnDark: '#F9FAFB',
  textOnDarkMuted: 'rgba(249, 250, 251, 0.72)',

  // Money status.
  success: '#059669',
  successTint: '#ECFDF5',
  warning: '#C2410C',
  warningTint: '#FFF1E6',
  danger: '#DC2626',
  dangerTint: '#FEF2F2',

  // Laid over a photo: behind a button on it, or over it while it is busy.
  scrim: 'rgba(29, 28, 26, 0.58)',
  veil: 'rgba(255, 255, 255, 0.72)',
  // A QR code must be true black on true white for every camera to read it.
  qrDark: '#000000',
  qrLight: '#FFFFFF',

  // Dims the page behind a bottom sheet.
  backdrop: 'rgba(29, 28, 26, 0.5)',

  // The tile behind a cloth's initial, where there is no photo.
  tile: '#F3F4F6',
  onTile: '#4B5563',
};

export type Palette = Record<keyof typeof LIGHT, string>;

// Dark neutral grey, not black: a surface still sits a step above the page, and
// is still held by a border. The yellow and the QR do not change: yellow is the
// shop's own, and a QR must stay black on white to be read by a camera.
const DARK: Palette = {
  ink: '#1B1D22',

  primary: '#FFCE1B',
  primaryPressed: '#E6B800',
  primaryTint: '#262A31',
  primaryTintStrong: '#343943',
  primaryWash: '#1C1F25',
  onPrimary: '#1F2937',
  onPrimaryTile: 'rgba(31, 41, 55, 0.12)',
  accent: '#D1D5DB',

  gold: '#C69B47',
  goldText: '#E0BC6E',
  goldTint: '#1F2228',
  ivory: '#24272D',

  background: '#121419',
  surface: '#1C1F25',
  surfaceSunken: '#16191E',
  border: '#2E323A',
  borderStrong: '#434852',

  textPrimary: '#F3F4F6',
  textSecondary: '#A8AEB8',
  textMuted: '#8B919C',

  textOnDark: '#F9FAFB',
  textOnDarkMuted: 'rgba(249, 250, 251, 0.72)',

  success: '#34D399',
  successTint: '#10291F',
  warning: '#FB923C',
  warningTint: '#2E1F12',
  danger: '#F87171',
  dangerTint: '#2F1B1B',

  scrim: 'rgba(29, 28, 26, 0.58)',
  veil: 'rgba(18, 20, 25, 0.72)',
  qrDark: '#000000',
  qrLight: '#FFFFFF',

  backdrop: 'rgba(0, 0, 0, 0.6)',

  tile: '#262A31',
  onTile: '#C7CBD2',
};

/** The colours of the moment: always read here, never kept in a constant. */
export const COLORS: Palette = { ...LIGHT };

// The showroom is the shop at its best, handed to a customer: a warm black, like an
// atelier lit at night, ivory words, and the logo's gold kept for what matters — a
// price, the tab chosen, a design kept. Each design's photo stands on a mat of warm
// paper, as a print in a gallery does, so a photo taken against a white wall and one
// cut out on nothing look alike. It is the same in either mode, and nothing in it
// competes with the designs' own colours.
export const SHOWROOM = {
  ground: '#0F0D0B',
  // A step up from the ground: a panel, the bar, a card's words.
  surface: '#191613',
  surfaceRaised: '#221E1A',
  line: 'rgba(240, 232, 218, 0.12)',
  lineStrong: 'rgba(240, 232, 218, 0.26)',
  // The paper a photo is shown on. A photo is multiplied into it, so its white
  // becomes the mat's own.
  mat: '#ECE7DF',
  text: '#F4EFE6',
  textMuted: 'rgba(244, 239, 230, 0.66)',
  textFaint: 'rgba(244, 239, 230, 0.42)',
  gold: '#D3B27C',
  goldDeep: '#9C7B45',
  // What is written on the ivory button.
  onLight: '#16130F',
  // Under a control laid over a photo.
  scrim: 'rgba(15, 13, 11, 0.62)',
  backdrop: 'rgba(8, 7, 6, 0.78)',
};

// An offer is set in the showroom's colours wherever it shows: on the setup page's
// list, in its preview, and in the showroom itself.
export const OFFER = {
  ground: SHOWROOM.ground,
  gold: SHOWROOM.gold,
};

// Corners are tight — a few pixels, never a capsule — the way business software
// is drawn: the shape stays quiet and the content does the talking.
export const RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  pill: 6,
} as const;

// Side padding of every screen's content.
export const GUTTER = 16;

/**
 * A white surface on the page: flat, held by a one-pixel border instead of a
 * shadow. Spread it first, so a style that sets its own border still wins.
 */
export const CARD = {
  borderWidth: 1,
  borderColor: COLORS.border,
} satisfies ViewStyle;

/**
 * Depth. card: none — a surface is held by its border. raised: the one thing
 * that floats above the page, the action button.
 */
export const SHADOW = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  raised: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
} as const satisfies Record<string, ViewStyle>;

// Inter, one file per weight: React Native on Android picks a weight by
// font name, so fontWeight is never set alongside these.
export const FONT = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  // The heaviest the app goes: anything heavier reads as a poster, not a bill.
  extrabold: 'Inter_700Bold',
} as const;

// The showroom's display face: a Garamond, for the names of designs and the few
// words set large, as a couture house sets them. Only in the showroom, never on a
// bill; from 18 px up, below which its fine strokes fade. Inter Light is for a
// figure set large there. Loaded with the showroom, not at every start of the
// app (see useShowroomFonts).
export const SERIF = {
  semibold: 'CormorantGaramond_600SemiBold',
  italic: 'CormorantGaramond_500Medium_Italic',
} as const;

export const FONT_LIGHT = 'Inter_300Light';

const OVERLINE_TRACKING = 0.5;

// Letter-spacing pulls Devanagari letters apart and breaks the line along their
// tops, on Android, so in Hindi the app's text sets none.
let spaced = true;

/** `px` of letter-spacing, or none while the app is in Hindi. */
export const tracking = (px: number): number => (spaced ? px : 0);

/**
 * The type scale. Every Text picks one of these and, at most, overrides
 * its color — so headings, labels and prices look the same on every page.
 */
export const TYPE = {
  display: {
    fontFamily: FONT.bold,
    fontSize: 26,
    fontVariant: ['tabular-nums'],
  },
  title: { fontFamily: FONT.semibold, fontSize: 19 },
  heading: { fontFamily: FONT.semibold, fontSize: 16 },
  body: { fontFamily: FONT.regular, fontSize: 15 },
  bodyStrong: { fontFamily: FONT.semibold, fontSize: 15 },
  label: { fontFamily: FONT.medium, fontSize: 13 },
  caption: { fontFamily: FONT.regular, fontSize: 12 },
  // A small heading that may carry Hindi: no letter-spacing, which on Android
  // pulls Devanagari letters apart and breaks the line along their tops.
  section: { fontFamily: FONT.semibold, fontSize: 13 },
  overline: {
    fontFamily: FONT.semibold,
    fontSize: 11,
    letterSpacing: OVERLINE_TRACKING,
    textTransform: 'uppercase',
  },
  price: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

/**
 * The tile behind a cloth's initial, where there is no photo. One neutral tone,
 * whatever the name: colour here would only be decoration.
 */
export const INITIAL_TILE = {
  background: COLORS.tile,
  foreground: COLORS.onTile,
};

/**
 * Sets the look to dark or light, and the type to Hindi or not. Style sheets
 * made earlier keep the old values until themedStyles rebuilds them.
 */
export function applyLook(dark: boolean, hindi: boolean): void {
  Object.assign(COLORS, dark ? DARK : LIGHT);
  CARD.borderColor = COLORS.border;
  INITIAL_TILE.background = COLORS.tile;
  INITIAL_TILE.foreground = COLORS.onTile;
  spaced = !hindi;
  TYPE.overline.letterSpacing = tracking(OVERLINE_TRACKING);
}
