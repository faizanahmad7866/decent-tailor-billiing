import { Directory, File, Paths } from 'expo-file-system';
import {
  pickPhotoAsset,
  saveResizedJpeg,
  type PhotoSource,
} from './photoFiles';

// Cloth photos are JPEGs in the app's own document folder. The database keeps
// only the file name, never the full path: the folder's absolute path can
// change across an app update, a bare name always resolves against wherever
// it is now.

export type { PhotoSource };

export type PickPhotoResult =
  | { status: 'picked'; imageName: string }
  | { status: 'canceled' }
  | { status: 'denied' };

const DIRECTORY_NAME = 'cloth-images';

// A catalog card and the bill show the photo a few inches wide at most;
// 1080px keeps the weave sharp at around 150 KB a file.
const MAX_EDGE = 1080;

function folder(): Directory {
  return new Directory(Paths.document, DIRECTORY_NAME);
}

function fileFor(imageName: string): File {
  return new File(folder(), imageName);
}

/**
 * Opens the camera or the gallery, then keeps a shrunk copy of the chosen
 * photo inside the app.
 */
export async function pickClothPhoto(
  source: PhotoSource
): Promise<PickPhotoResult> {
  const picked = await pickPhotoAsset(source);
  if (picked.status !== 'picked') return picked;
  return {
    status: 'picked',
    imageName: await saveResizedJpeg(picked.asset, folder(), 'cloth', MAX_EDGE),
  };
}

/** A uri <Image> can show, or null when the file is no longer on the phone. */
export function clothPhotoUri(imageName: string): string | null {
  try {
    const file = fileFor(imageName);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/**
 * Best effort: a photo that can't be deleted is only wasted space, never a
 * reason to fail the save or delete that let go of it.
 */
export function deleteClothPhoto(imageName: string): void {
  try {
    const file = fileFor(imageName);
    if (file.exists) file.delete();
  } catch {
    // See above.
  }
}

/** Every cloth photo on this phone, for the backup to carry. */
export function listClothPhotoFiles(): File[] {
  const target = folder();
  if (!target.exists) return [];
  return target.list().filter((entry): entry is File => entry instanceof File);
}

/** Deletes every cloth photo, leaving the folder empty — for "delete all data". */
export function clearClothPhotos(): void {
  const target = folder();
  if (target.exists) target.delete();
  target.create({ intermediates: true });
}

/**
 * Restore: swaps every cloth photo for the files in `staged`, which is
 * emptied. Photos the backup doesn't have are gone afterwards — restore
 * replaces all data, and the restored cloths don't point at them.
 */
export function replaceClothPhotos(staged: Directory): void {
  const target = folder();
  if (target.exists) target.delete();
  target.create({ intermediates: true });
  for (const entry of staged.list()) {
    if (entry instanceof File) entry.moveSync(new File(target, entry.name));
  }
}
