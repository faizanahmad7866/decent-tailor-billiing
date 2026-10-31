import { designHindi } from '../utils/designHindi';
import { formatRupees } from '../utils/money';
import { SHOP } from './shop';

// The words that go with a design's catalogue. WhatsApp opens a chat on a
// number only through a link, and a link carries text, never a file — so the
// customer gets one short line first, and the PDF follows in that same chat.

interface SharedDesign {
  id: number;
  name: string;
  pricePaise: number;
}

/** The line sent to the customer before the PDF. */
export function designMessage(design: SharedDesign): string {
  return (
    `Namaste 🙏 ${titleCase(SHOP.name)} se aapke liye design: ` +
    `*${design.name.trim()}${hindiNote(design.name)}*` +
    `${design.pricePaise > 0 ? ` — ${formatRupees(design.pricePaise)}` : ''}. ` +
    'Poora catalogue PDF abhi bhej rahe hain.'
  );
}

/** " (रॉयल जोधपुरी सूट)" after the name, or nothing where there is none. */
function hindiNote(name: string): string {
  const hindi = designHindi(name);
  return hindi ? ` (${hindi})` : '';
}

/** What the catalogue's QR writes in the chat it opens with the shop. */
export function designEnquiry(design: SharedDesign): string {
  return `Hi ${titleCase(SHOP.name)}, I am interested in design No. ${design.id} — ${design.name.trim()}.`;
}

/**
 * "Decent Tailor - Royal Jodhpuri Suit.pdf": the name the customer sees on
 * the file in WhatsApp, and the one it is saved under. Characters a file
 * name can't hold are dropped.
 */
export function catalogFileName(design: SharedDesign): string {
  const name = design.name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim();
  return `${titleCase(SHOP.name)} - ${name || `Design ${design.id}`}.pdf`;
}

/** "DECENT TAILOR" → "Decent Tailor". */
export function titleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
