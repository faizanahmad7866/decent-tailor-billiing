import { metersToInput, type Discount } from '../utils/billMath';

// What the app says, in Hindi, as the phone's own Hindi voice reads it. The
// figures go in as digits: the voice reads 1250 as "एक हज़ार दो सौ पचास"
// itself, more naturally than a word list here would. "Percent" and
// "discount" are said the way the counter says them — the English words, in
// Devanagari so the Hindi voice pronounces them rather than spelling them.

/** "5 मीटर", "2.5 मीटर"; null for no length. */
export function spokenMeters(lengthCm: number | null): string | null {
  if (!lengthCm || lengthCm <= 0) return null;
  return `${metersToInput(lengthCm)} मीटर`;
}

/** "10 परसेंट डिस्काउंट", "500 रुपये डिस्काउंट"; null where there is none. */
export function spokenDiscount(discount: Discount | null): string | null {
  if (!discount) return null;
  if (discount.kind === 'percent') {
    return discount.percent > 0
      ? `${Number(discount.percent.toFixed(2))} परसेंट डिस्काउंट`
      : null;
  }
  if (discount.paise <= 0) return null;
  const rupees = Math.floor(discount.paise / 100);
  const paise = discount.paise % 100;
  return `${rupees} रुपये${paise ? ` ${paise} पैसे` : ''} डिस्काउंट`;
}

/** Said when the voice is switched on, so the tailor hears it works. */
export const VOICE_ON_LINE = 'आवाज़ चालू है';

/**
 * The showroom's welcome, when the tailor turns its voice on: the greeting as it
 * opens, then the catalogue (`voice/welcome.ts`). The shop's name is in
 * Devanagari so the Hindi voice says it rather than spelling it out.
 */
export const SHOWROOM_WELCOME_LINES = [
  'डीसेंट टेलर में आपका स्वागत है',
  'यह हमारा कैटलॉग है, इसमें आप सारे डिज़ाइन देख सकते हैं',
] as const;
