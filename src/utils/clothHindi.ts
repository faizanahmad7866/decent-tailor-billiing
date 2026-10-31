import { isDevanagari, toHindi } from './hinglishHindi';

/*
 * A cloth's name in Hindi letters, worked out on the phone as the name is
 * typed — the same idea as the main app's notes (utils/hinglishHindi): the
 * letters change, never the meaning, so "Linen White" becomes "लिनन व्हाइट".
 *
 * The main app's letter-by-letter reading is built for a tailor's Hinglish
 * ("dhila", "bada") and does poorly on English fabric and brand words —
 * "Raymond Cotton" would come out रय्मोन्ड कोट्टोन. So the words a cloth shop
 * actually writes are spelled out here, the way they are written in Hindi;
 * anything else falls back to that reading. A name the tailor knows better
 * than this can always be corrected by hand, and what they type is kept.
 */

// Lowercase, without punctuation. Spelled the way Hindi writes them: ऑ for the
// English "o" in cotton, ट for t.
const CLOTH_WORDS: Record<string, string> = {
  // Types, finishes and seasons
  striped: 'स्ट्राइप्ड',
  matty: 'मैटी',
  matte: 'मैट',
  digital: 'डिजिटल',
  party: 'पार्टी',
  wear: 'वियर',
  export: 'एक्सपोर्ट',
  quality: 'क्वालिटी',
  first: 'फर्स्ट',
  copy: 'कॉपी',
  luxury: 'लग्ज़री',
  touch: 'टच',
  dobby: 'डॉबी',
  wedding: 'वेडिंग',
  summer: 'समर',
  winter: 'विंटर',
  look: 'लुक',
  ash: 'ऐश',
  charcoal: 'चारकोल',
  rust: 'रस्ट',
  pista: 'पिस्ता',
  peacock: 'पीकॉक',
  rama: 'रामा',
  // Fabrics
  cotton: 'कॉटन',
  linen: 'लिनन',
  silk: 'सिल्क',
  velvet: 'वेलवेट',
  khadi: 'खादी',
  georgette: 'जॉर्जेट',
  chiffon: 'शिफॉन',
  denim: 'डेनिम',
  wool: 'वूल',
  woolen: 'वूलन',
  woollen: 'वूलन',
  polyester: 'पॉलिएस्टर',
  poly: 'पॉली',
  rayon: 'रेयॉन',
  satin: 'सैटिन',
  crepe: 'क्रेप',
  tweed: 'ट्वीड',
  corduroy: 'कॉर्डरॉय',
  jute: 'जूट',
  nylon: 'नायलॉन',
  terry: 'टैरी',
  terrycot: 'टैरीकॉट',
  viscose: 'विस्कोस',
  lycra: 'लाइक्रा',
  flannel: 'फ्लैनल',
  canvas: 'कैनवास',
  muslin: 'मलमल',
  mulmul: 'मलमल',
  organza: 'ऑर्गेंज़ा',
  net: 'नेट',
  lace: 'लेस',
  brocade: 'ब्रोकेड',
  jamawar: 'जामावार',
  jacquard: 'जैक्वार्ड',
  suiting: 'सूटिंग',
  shirting: 'शर्टिंग',
  twill: 'ट्विल',
  poplin: 'पॉपलिन',
  cambric: 'कैम्ब्रिक',
  voile: 'वॉयल',
  chambray: 'शैम्ब्रे',
  oxford: 'ऑक्सफोर्ड',
  giza: 'गीज़ा',
  egyptian: 'इजिप्शियन',
  pima: 'पीमा',
  tussar: 'टसर',
  tussor: 'टसर',
  matka: 'मटका',
  dupion: 'डुपियन',
  taffeta: 'टैफेटा',
  jersey: 'जर्सी',
  fleece: 'फ्लीस',
  cashmere: 'कैशमियर',
  pashmina: 'पश्मीना',
  merino: 'मेरिनो',
  worsted: 'वर्स्टेड',
  mohair: 'मोहेयर',
  blend: 'ब्लेंड',
  blended: 'ब्लेंडेड',
  knit: 'निट',
  // Brands and mills
  raymond: 'रेमंड',
  raymonds: 'रेमंड',
  armani: 'अरमानी',
  siyaram: 'सियाराम',
  siyarams: 'सियाराम',
  vimal: 'विमल',
  mafatlal: 'मफतलाल',
  arvind: 'अरविंद',
  digjam: 'दिगजाम',
  grasim: 'ग्रासिम',
  oswal: 'ओसवाल',
  bombay: 'बॉम्बे',
  dyeing: 'डाइंग',
  reid: 'रीड',
  taylor: 'टेलर',
  cambridge: 'कैम्ब्रिज',
  // Quality and kind
  classic: 'क्लासिक',
  premium: 'प्रीमियम',
  royal: 'रॉयल',
  pure: 'प्योर',
  super: 'सुपर',
  fine: 'फाइन',
  special: 'स्पेशल',
  deluxe: 'डीलक्स',
  gold: 'गोल्ड',
  silver: 'सिल्वर',
  diamond: 'डायमंड',
  star: 'स्टार',
  new: 'न्यू',
  original: 'ओरिजिनल',
  import: 'इम्पोर्ट',
  imported: 'इम्पोर्टेड',
  local: 'लोकल',
  plain: 'प्लेन',
  check: 'चेक',
  checks: 'चेक्स',
  stripe: 'स्ट्राइप',
  stripes: 'स्ट्राइप्स',
  printed: 'प्रिंटेड',
  print: 'प्रिंट',
  design: 'डिज़ाइन',
  self: 'सेल्फ',
  soft: 'सॉफ्ट',
  light: 'लाइट',
  dark: 'डार्क',
  heavy: 'हैवी',
  thick: 'थिक',
  thin: 'थिन',
  club: 'क्लब',
  suit: 'सूट',
  and: 'एंड',
  // Colours, as they are written in Hindi shops
  white: 'व्हाइट',
  black: 'ब्लैक',
  blue: 'ब्लू',
  red: 'रेड',
  green: 'ग्रीन',
  yellow: 'येलो',
  pink: 'पिंक',
  grey: 'ग्रे',
  gray: 'ग्रे',
  brown: 'ब्राउन',
  cream: 'क्रीम',
  beige: 'बेज',
  maroon: 'मरून',
  navy: 'नेवी',
  sky: 'स्काई',
  orange: 'ऑरेंज',
  purple: 'पर्पल',
  violet: 'वायलेट',
  golden: 'गोल्डन',
  off: 'ऑफ',
  mehndi: 'मेहंदी',
  peach: 'पीच',
  mustard: 'मस्टर्ड',
  olive: 'ऑलिव',
  wine: 'वाइन',
  coffee: 'कॉफी',
  chocolate: 'चॉकलेट',
};

/**
 * A cloth name written in Hindi letters. Numbers and punctuation stay as
 * they are, and a name already in Hindi comes back untouched.
 */
export function clothNameToHindi(name: string): string {
  if (!name.trim() || isDevanagari(name)) return name;
  // "Siyaram's" is Siyaram: the possessive is not a word to read out.
  const plain = name.replace(/([A-Za-z])['’]s\b/g, '$1');
  return plain.replace(/[A-Za-z]+/g, (word) => {
    return CLOTH_WORDS[word.toLowerCase()] ?? toHindi(word);
  });
}

/**
 * The Hindi to show beside a cloth's name: what the tailor saved for it, or,
 * for a cloth with none saved, what the name works out to. Null when there is
 * nothing to add — a name with no letters to change, like "100".
 */
export function clothHindi(name: string, saved: string | null): string | null {
  const hindi = saved?.trim() || clothNameToHindi(name);
  return hindi.trim() && hindi !== name.trim() ? hindi : null;
}

/**
 * The Hindi for a cloth line as a bill writes it — the cloth's Hindi name,
 * then its type in Hindi after a dash, as the English reads "Armani — Royal
 * Blue": "अरमानी — रॉयल ब्लू". The type is worked out from what was typed, so
 * it needs nothing saved. Null when there is nothing to add in either.
 */
export function clothLineHindi(
  name: string,
  saved: string | null,
  variant?: string | null
): string | null {
  const hindiName = clothHindi(name, saved);
  const type = variant?.trim();
  if (!type) return hindiName;
  const hindiType = clothHindi(type, null);
  if (!hindiName && !hindiType) return null;
  return `${hindiName ?? name} — ${hindiType ?? type}`;
}
