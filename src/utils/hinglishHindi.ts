/*
 * The tailor writes a note the way he speaks it, on the English keyboard —
 * "dhila rakhna, pocket bada". The worker who reads it off the slip reads
 * Hindi. This writes the same words in Hindi letters, so neither has to
 * change what they do.
 *
 * It changes the letters, never the meaning: "keep it loose" stays "keep it
 * loose", written "कीप इट लूस". Translation would need a dictionary of the
 * language and a phone that is online; this is the shop's own words in the
 * shop's own script, worked out on the phone itself.
 *
 * Two parts, in this order:
 *   1. The words a tailor actually writes, spelled out — these come out
 *      exactly right, however they are typed.
 *   2. Anything else, letter by letter. Hinglish spelling is loose ("bada"
 *      for बड़ा), so a rare word can come out a shade off. It is readable,
 *      and the note as typed is always printed beside it, so nothing is
 *      lost if a word lands oddly.
 */

/** Whether text is already written in Hindi letters. */
export function isDevanagari(text: string): boolean {
  return /[ऀ-ॿ]/.test(text);
}

// The shop's own vocabulary: garment parts, what to do to them, and the
// English words a tailor writes in the middle of a Hindi sentence. Keys are
// lowercase, without punctuation; common misspellings point at the same word.
const WORDS: Record<string, string> = {
  // Garments
  shirt: 'शर्ट',
  kameez: 'कमीज़',
  kamiz: 'कमीज़',
  pant: 'पैंट',
  pent: 'पैंट',
  pajama: 'पजामा',
  payjama: 'पजामा',
  kurta: 'कुर्ता',
  coat: 'कोट',
  salwar: 'सलवार',
  shalwar: 'सलवार',
  sadri: 'सदरी',
  pathani: 'पठानी',
  jacket: 'जैकेट',
  blazer: 'ब्लेज़र',
  jodhpuri: 'जोधपुरी',
  // Parts
  collar: 'कॉलर',
  kalar: 'कॉलर',
  cuff: 'कफ़',
  pocket: 'पॉकेट',
  jeb: 'जेब',
  button: 'बटन',
  batan: 'बटन',
  chain: 'चेन',
  zip: 'ज़िप',
  astar: 'अस्तर',
  lining: 'लाइनिंग',
  kaaj: 'काज',
  kaj: 'काज',
  patti: 'पट्टी',
  ghera: 'घेरा',
  gala: 'गला',
  kamar: 'कमर',
  baju: 'बाजू',
  asteen: 'आस्तीन',
  seat: 'सीट',
  chhati: 'छाती',
  chati: 'छाती',
  lambai: 'लंबाई',
  chaudai: 'चौड़ाई',
  mandi: 'मंडी',
  bottom: 'बॉटम',
  kaaf: 'काफ',
  ghutna: 'घुटना',
  latak: 'लटक',
  stand: 'स्टैंड',
  shoulder: 'शोल्डर',
  // What to do
  rakhna: 'रखना',
  rakho: 'रखो',
  rakhni: 'रखनी',
  karna: 'करना',
  karo: 'करो',
  karni: 'करनी',
  lagana: 'लगाना',
  lagao: 'लगाओ',
  silna: 'सिलना',
  silai: 'सिलाई',
  kaatna: 'काटना',
  katna: 'काटना',
  dena: 'देना',
  deni: 'देनी',
  banana: 'बनाना',
  banao: 'बनाओ',
  check: 'चेक',
  note: 'नोट',
  // How
  dhila: 'ढीला',
  dheela: 'ढीला',
  dhili: 'ढीली',
  tight: 'टाइट',
  tait: 'टाइट',
  fit: 'फिट',
  fitting: 'फिटिंग',
  loose: 'लूज़',
  bada: 'बड़ा',
  bara: 'बड़ा',
  badi: 'बड़ी',
  chhota: 'छोटा',
  chota: 'छोटा',
  chhoti: 'छोटी',
  choti: 'छोटी',
  lamba: 'लंबा',
  lambi: 'लंबी',
  double: 'डबल',
  single: 'सिंगल',
  extra: 'एक्स्ट्रा',
  half: 'हाफ',
  full: 'फुल',
  plain: 'प्लेन',
  fancy: 'फैंसी',
  same: 'सेम',
  jaisa: 'जैसा',
  waisa: 'वैसा',
  naya: 'नया',
  purana: 'पुराना',
  thoda: 'थोड़ा',
  zyada: 'ज़्यादा',
  jyada: 'ज़्यादा',
  // Where
  andar: 'अंदर',
  bahar: 'बाहर',
  upar: 'ऊपर',
  niche: 'नीचे',
  side: 'साइड',
  front: 'फ्रंट',
  back: 'बैक',
  left: 'लेफ्ट',
  right: 'राइट',
  // The English words that come up on a slip, spelled the way a Hindi
  // reader expects them — letter by letter these come out a shade off.
  stitch: 'स्टिच',
  print: 'प्रिंट',
  machine: 'मशीन',
  master: 'मास्टर',
  line: 'लाइन',
  open: 'ओपन',
  close: 'क्लोज़',
  round: 'राउंड',
  style: 'स्टाइल',
  simple: 'सिंपल',
  cross: 'क्रॉस',
  dress: 'ड्रेस',
  neck: 'नेक',
  sleeve: 'स्लीव',
  waist: 'वेस्ट',
  length: 'लेंथ',
  ready: 'रेडी',
  elastic: 'इलास्टिक',
  lastik: 'लास्तिक',
  order: 'ऑर्डर',
  delivery: 'डिलीवरी',
  emergency: 'इमरजेंसी',
  customer: 'कस्टमर',
  total: 'टोटल',
  cash: 'कैश',
  online: 'ऑनलाइन',
  // Work words
  sample: 'सैंपल',
  design: 'डिज़ाइन',
  pattern: 'पैटर्न',
  work: 'वर्क',
  urgent: 'अर्जेंट',
  jaldi: 'जल्दी',
  kapda: 'कपड़ा',
  kapde: 'कपड़े',
  cloth: 'क्लॉथ',
  inch: 'इंच',
  number: 'नंबर',
  size: 'साइज़',
  // The bundle that comes in with a groom's cloth and goes back out with it,
  // so the accessories note on the tailor's copy prints in the words the shop
  // says out loud — letter by letter these come out wrong ('juti' as जुटी,
  // which is not a shoe).
  juti: 'जूती',
  jooti: 'जूती',
  juta: 'जूता',
  jutta: 'जूता',
  joota: 'जूता',
  mojri: 'मोजरी',
  ghadi: 'घड़ी',
  ghadhi: 'घड़ी',
  chashma: 'चश्मा',
  safa: 'साफ़ा',
  saafa: 'साफ़ा',
  pagdi: 'पगड़ी',
  pagri: 'पगड़ी',
  dupatta: 'दुपट्टा',
  chunni: 'चुन्नी',
  mala: 'माला',
  kalgi: 'कलगी',
  kamarband: 'कमरबंद',
  patka: 'पटका',
  topi: 'टोपी',
  rumal: 'रुमाल',
  brooch: 'ब्रोच',
  square: 'स्क्वायर',
  sherwani: 'शेरवानी',
  buttons: 'बटन',
  // Joining words
  aur: 'और',
  ya: 'या',
  par: 'पर',
  ka: 'का',
  ki: 'की',
  ke: 'के',
  se: 'से',
  me: 'में',
  mein: 'में',
  ko: 'को',
  hai: 'है',
  nahi: 'नहीं',
  mat: 'मत',
  bhi: 'भी',
  sab: 'सब',
  ek: 'एक',
  do: 'दो',
  teen: 'तीन',
  char: 'चार',
};

// Letter by letter, longest spelling first so "chh" is read before "ch".
const CONSONANTS: Array<[string, string]> = [
  ['chh', 'छ'],
  ['tch', 'च'],
  ['shh', 'श'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['ch', 'च'],
  ['jh', 'झ'],
  ['th', 'थ'],
  ['dh', 'ध'],
  ['ph', 'फ'],
  ['bh', 'भ'],
  ['sh', 'श'],
  ['ck', 'क'],
  ['k', 'क'],
  ['g', 'ग'],
  ['c', 'क'],
  ['j', 'ज'],
  ['z', 'ज़'],
  ['t', 'ट'],
  ['d', 'ड'],
  ['n', 'न'],
  ['p', 'प'],
  ['f', 'फ़'],
  ['b', 'ब'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['v', 'व'],
  ['w', 'व'],
  ['s', 'स'],
  ['h', 'ह'],
  ['x', 'क्स'],
  ['q', 'क़'],
];

// Vowels twice over: the mark that hangs off a consonant, and the letter
// that stands on its own at the start of a word.
const VOWELS: Array<[string, string, string]> = [
  ['aa', 'ा', 'आ'],
  ['ai', 'ै', 'ऐ'],
  ['au', 'ौ', 'औ'],
  ['ea', 'ी', 'ई'],
  ['ee', 'ी', 'ई'],
  ['ii', 'ी', 'ई'],
  ['oo', 'ू', 'ऊ'],
  ['uu', 'ू', 'ऊ'],
  ['a', '', 'अ'],
  ['i', 'ि', 'इ'],
  ['u', 'ु', 'उ'],
  ['e', 'े', 'ए'],
  ['o', 'ो', 'ओ'],
];

/** The mark that ties two consonants into one cluster — the ्  of स्ट. */
const HALANT = '्';

/** How a vowel is written when the word ends on it, hanging off a consonant. */
const LONG_AT_END: Record<string, string> = { a: 'ा', i: 'ी', ai: 'ाई' };

type Unit =
  | { kind: 'consonant'; roman: string; letter: string }
  | { kind: 'vowel'; roman: string; sign: string; alone: string }
  | { kind: 'other'; letter: string };

/** A word read as the sounds it is made of, longest spelling first. */
function readUnits(word: string): Unit[] {
  const units: Unit[] = [];
  let i = 0;
  while (i < word.length) {
    const consonant = CONSONANTS.find(([roman]) => word.startsWith(roman, i));
    if (consonant) {
      units.push({
        kind: 'consonant',
        roman: consonant[0],
        letter: consonant[1],
      });
      i += consonant[0].length;
      continue;
    }
    const vowel = VOWELS.find(([roman]) => word.startsWith(roman, i));
    if (vowel) {
      units.push({
        kind: 'vowel',
        roman: vowel[0],
        sign: vowel[1],
        alone: vowel[2],
      });
      i += vowel[0].length;
      continue;
    }
    // A digit or a stray mark stands as it is.
    units.push({ kind: 'other', letter: word[i] });
    i += 1;
  }
  return units;
}

function transliterateWord(word: string): string {
  const lower = word.toLowerCase();
  const units = readUnits(lower);

  // "simple" is written सिंपल, not सिम्पले: an English word's last e is
  // silent, and the consonant before it is read with its own a. Only on a
  // long enough word, so ke, se and me keep theirs.
  const last = units[units.length - 1];
  const silentE =
    lower.length >= 4 &&
    last?.kind === 'vowel' &&
    last.roman === 'e' &&
    units[units.length - 2]?.kind === 'consonant';
  if (silentE) units.pop();
  // "cross" ends in one स, not two — a doubled letter at the end of an
  // English word is one sound.
  const end = units.length - 1;
  if (
    units[end]?.kind === 'consonant' &&
    units[end - 1]?.kind === 'consonant' &&
    (units[end] as { roman: string }).roman ===
      (units[end - 1] as { roman: string }).roman
  ) {
    units.pop();
  }

  let out = '';
  units.forEach((unit, index) => {
    const next = units[index + 1];
    const isLast = index === units.length - 1;
    if (unit.kind === 'consonant') {
      out += unit.letter;
      // Two consonants running together are one cluster: st is स्ट, not सट.
      // At the end of a word the sound just stops — शर्ट, not शर्ट्. Where a
      // silent e was dropped, the two it left behind are read apart: सिम्पल.
      const apart = silentE && index === units.length - 2;
      if (next?.kind === 'consonant' && !apart) out += HALANT;
      return;
    }
    if (unit.kind === 'vowel') {
      const previous = units[index - 1];
      if (previous?.kind !== 'consonant') {
        out += unit.alone;
        return;
      }
      // The vowel a word ends on is the long one a tailor hears: dori is
      // डोरी, mota मोटा, bhai भाई — never the clipped सोनु of a name cut off
      // halfway.
      if (isLast && LONG_AT_END[unit.roman]) {
        out += LONG_AT_END[unit.roman];
        return;
      }
      out += unit.sign;
      return;
    }
    out += unit.letter;
  });

  return out;
}

/**
 * The same note in Hindi letters. Text already written in Hindi is left
 * exactly as it is, and so are numbers and punctuation.
 */
export function toHindi(text: string): string {
  if (!text.trim() || isDevanagari(text)) return text;

  // Split on the gaps between words, keeping them, so "5 inch, dhila" comes
  // back spaced and punctuated the way it was written.
  return text.replace(/[A-Za-z]+/g, (word) => {
    const known = WORDS[word.toLowerCase()];
    return known ?? transliterateWord(word);
  });
}
