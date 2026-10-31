import { Linking } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { PatternItem } from '../repositories/patternRepo';
import { clothPhotoUri } from '../storage/clothImageStore';
import { patternMediaUri } from '../storage/patternMediaStore';
import { messagingNumber } from '../utils/phone';
import { messageUrl } from './billMessage';
import { buildDesignCatalogHtml } from './designCatalogHtml';
import {
  catalogFileName,
  designEnquiry,
  designMessage,
} from './designShareText';
import { getBrightLogoDataUri } from './logoAsset';
import { SHOP } from './shop';
import { qrDataUri } from './upiQr';

// A design's catalogue as a PDF: made on the phone from the design, its
// photos and the shop's details, then sent to a customer or saved.

// A4 in points, the paper a PDF reader opens a document on.
const A4 = { width: 595, height: 842 };

/**
 * A photo of the app's own, shrunk so its longest edge is at most `maxEdge`,
 * as a JPEG data URI — or null if it can't be read. The photos are kept far
 * sharper than a page needs, and Android's PDF writer fails on a page heavy
 * with full-size images: it starts writing before the page has finished
 * laying out.
 */
async function photoDataUri(
  uri: string | null,
  maxEdge: number
): Promise<string | null> {
  if (!uri) return null;
  const context = ImageManipulator.manipulate(uri);
  try {
    const original = await context.renderAsync();
    const { width, height } = original;
    original.release();
    if (Math.max(width, height) > maxEdge) {
      context.resize(
        width >= height ? { width: maxEdge } : { height: maxEdge }
      );
    }
    const rendered = await context.renderAsync();
    try {
      const { base64 } = await rendered.saveAsync({
        compress: 0.82,
        format: SaveFormat.JPEG,
        base64: true,
      });
      return base64 ? `data:image/jpeg;base64,${base64}` : null;
    } finally {
      rendered.release();
    }
  } catch {
    return null;
  } finally {
    context.release();
  }
}

// How large the photos go into the PDF: sharp on a phone's screen first, and
// smaller on each try after, should the phone fail to write a page that heavy.
const PHOTO_SIZES = [
  { photo: 1100, swatch: 200 },
  { photo: 700, swatch: 140 },
  { photo: 450, swatch: 100 },
];

async function printCatalog(
  item: PatternItem,
  size: (typeof PHOTO_SIZES)[number],
  logo: string | null
): Promise<string> {
  const [photos, clothPhotos] = await Promise.all([
    Promise.all(
      item.images.map((name) => photoDataUri(patternMediaUri(name), size.photo))
    ),
    Promise.all(
      item.cloths.map((cloth) =>
        photoDataUri(
          cloth.imageName ? clothPhotoUri(cloth.imageName) : null,
          size.swatch
        )
      )
    ),
  ]);
  const shopNumber = messagingNumber(SHOP.contacts[0].phone);
  const html = buildDesignCatalogHtml(item, {
    logo,
    photos: photos.filter((photo): photo is string => photo !== null),
    clothPhotos,
    chatQr: shopNumber
      ? qrDataUri(messageUrl('whatsapp', shopNumber, designEnquiry(item)))
      : null,
    date: new Date(),
  });
  const { uri } = await Print.printToFileAsync({ html, ...A4 });
  return uri;
}

/**
 * Makes the design's catalogue and returns the PDF, under a name the
 * customer can read ("Decent Tailor - Royal Jodhpuri Suit.pdf"). A photo
 * that can't be read is left out rather than stopping the catalogue; a PDF
 * the phone fails to write is tried again with smaller photos.
 */
export async function makeDesignCatalog(item: PatternItem): Promise<File> {
  const logo = await getBrightLogoDataUri().catch(() => null);
  let printed: string | null = null;
  let failure: unknown = null;
  for (const size of PHOTO_SIZES) {
    try {
      printed = await printCatalog(item, size, logo);
      break;
    } catch (error) {
      failure = error;
    }
  }
  if (!printed) throw failure ?? new Error('The PDF could not be made');

  // The readable name is a nicety: if the file can't be renamed, the PDF
  // still goes, under the name the printer gave it.
  const file = new File(printed);
  try {
    const named = new File(Paths.cache, catalogFileName(item));
    if (named.exists) named.delete();
    await file.move(named);
    return named;
  } catch {
    return file;
  }
}

/** Opens the share sheet with the catalogue — WhatsApp, Gmail, Drive… */
export async function shareDesignCatalog(
  pdf: File,
  item: PatternItem
): Promise<void> {
  await Sharing.shareAsync(pdf.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: item.name,
  });
}

// The folder last saved to, so the picker opens there next time.
let lastFolderUri: string | undefined;

/**
 * Saves the catalogue to a folder the tailor picks — Downloads, say — where
 * it stays on the phone. Returns the file's name, or null when the picker
 * was closed without choosing.
 */
export async function saveDesignCatalog(
  pdf: File,
  item: PatternItem
): Promise<string | null> {
  let folder: Directory;
  try {
    folder = await Directory.pickDirectoryAsync(lastFolderUri);
  } catch (error) {
    if (isCancel(error)) return null;
    throw error;
  }
  lastFolderUri = folder.uri;
  const name = catalogFileName(item);
  const saved = folder.createFile(name, 'application/pdf');
  saved.write(await pdf.bytes());
  return name;
}

function isCancel(error: unknown): boolean {
  const { code, message } = (error ?? {}) as {
    code?: string;
    message?: string;
  };
  return code === 'ERR_PICKER_CANCELLED' || /cancel/i.test(message ?? '');
}

/**
 * Opens WhatsApp on a chat with `mobile`, the design's one-line message
 * already written, for the PDF to follow in that chat. Throws if the number
 * isn't a mobile number or WhatsApp can't be opened.
 */
export async function sendDesignMessage(
  item: PatternItem,
  mobile: string
): Promise<void> {
  const phone = messagingNumber(mobile);
  if (!phone) throw new Error('Not a mobile number');
  await Linking.openURL(messageUrl('whatsapp', phone, designMessage(item)));
}
