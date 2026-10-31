import { Text, TextInput } from 'react-native';

/**
 * The most a phone's own font-size setting may enlarge the app's text.
 *
 * Android lets the owner scale all text (Settings › Display › Font size) up to
 * twice its size. The app's bars and buttons have fixed heights and widths —
 * the header, the Save button, a price on a card — and at double size their
 * words spill out and get cut off. "Large" (1.15×) and "Larger" (1.3×) are
 * honoured in full, so anyone who reads bigger still does; past 1.3× the text
 * stops growing and every word stays inside its control.
 *
 * Applied once, at startup, before anything renders (index.ts). A single text
 * can still set its own maxFontSizeMultiplier.
 */
export const MAX_FONT_SCALE = 1.3;

type WithDefaultProps = { defaultProps?: Record<string, unknown> };

for (const component of [Text, TextInput] as unknown as WithDefaultProps[]) {
  component.defaultProps = {
    ...component.defaultProps,
    maxFontSizeMultiplier: MAX_FONT_SCALE,
  };
}
