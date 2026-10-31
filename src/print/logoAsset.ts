import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

// A deeper gold than the on-screen logo, made for paper (shared with the
// main app's printouts).
const logoModule = require('../../assets/brand/logo-print.png');
// The bright gold mark of the app's own header, for a design catalogue: it is
// read on a screen, not printed, where the deeper gold looks brown.
const brightLogoModule = require('../../assets/brand/logo-gold.png');
// The bank's own QR for the shop, as in the main app: the fallback printed if
// a QR carrying the amount can't be made.
const paymentBarcodeModule = require('../../assets/brand/payment-barcode.png');

const cache = new Map<number, Promise<string>>();

/**
 * Base64 data URI for a bundled image. expo-print's renderer can't load a
 * bundled image by its module path, so it is read from disk once and
 * embedded in the HTML. A failed read isn't kept, so the next print tries
 * again.
 */
function imageDataUri(module: number): Promise<string> {
  let pending = cache.get(module);
  if (!pending) {
    pending = readImage(module);
    pending.catch(() => cache.delete(module));
    cache.set(module, pending);
  }
  return pending;
}

async function readImage(module: number): Promise<string> {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  let localUri = asset.localUri;

  // In a release Android build the image ships as an app resource, and
  // expo-asset hands back only its resource name — enough for <Image>, not a
  // file that can be read. A fresh asset for that name, with no hash, makes
  // expo-asset copy the resource out and return a real file:// address.
  if (localUri && !localUri.includes(':')) {
    const resource = new Asset({
      name: asset.name,
      type: asset.type,
      hash: null,
      uri: localUri,
    });
    await resource.downloadAsync();
    localUri = resource.localUri;
  }

  if (!localUri) throw new Error('Image could not be read');
  return `data:image/png;base64,${await new File(localUri).base64()}`;
}

/** The logo, for the letterhead of the printed bill. */
export function getLogoDataUri(): Promise<string> {
  return imageDataUri(logoModule);
}

/** The bank's own payment QR image. */
export function getPaymentBarcodeDataUri(): Promise<string> {
  return imageDataUri(paymentBarcodeModule);
}

/** The bright gold logo, for the letterhead of a design catalogue. */
export function getBrightLogoDataUri(): Promise<string> {
  return imageDataUri(brightLogoModule);
}
