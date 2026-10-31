import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import type { CropBox } from '../utils/photoCrop';
import {
  pickPhotoAsset,
  saveResizedJpeg,
  type PickedPhoto,
  type PhotoSource,
} from './photoFiles';

// The photos and the video of the pattern catalogue, in a folder of their
// own in the app's documents. The database keeps file names only, as for
// cloth photos: a bare name always resolves against wherever the folder is
// now.

const DIRECTORY_NAME = 'pattern-media';

// Shown full width on a phone, and swiped through in front of a customer:
// sharper than a cloth's photo, still around 250 KB a file.
const MAX_EDGE = 1440;

/** The longest video kept. A backup carries it inside the database file. */
export const MAX_VIDEO_MB = 40;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

export type { PhotoSource };

export type PickPatternVideoResult =
  | { status: 'picked'; videoName: string }
  | { status: 'canceled' }
  | { status: 'tooLarge' };

function folder(): Directory {
  return new Directory(Paths.document, DIRECTORY_NAME);
}

function fileFor(name: string): File {
  return new File(folder(), name);
}

/** Opens the camera or the gallery. Nothing is kept until keepPatternPhoto. */
export const choosePatternPhoto = (source: PhotoSource): Promise<PickedPhoto> =>
  pickPhotoAsset(source);

/** Keeps a shrunk copy of a chosen photo, or of the part of it in `crop`. */
export const keepPatternPhoto = (
  asset: ImagePicker.ImagePickerAsset,
  crop: CropBox | null
): Promise<string> =>
  saveResizedJpeg(asset, folder(), 'pattern', MAX_EDGE, crop);

/**
 * Keeps the part in `crop` of a photo already kept, as a new file: the old one is
 * still the design's until the form is saved, and stays if it is not.
 */
export const cropPatternPhoto = (
  name: string,
  crop: CropBox
): Promise<string> =>
  saveResizedJpeg(
    { uri: fileFor(name).uri, width: 0, height: 0 },
    folder(),
    'pattern',
    MAX_EDGE,
    crop
  );

// The extension the phone gave the video, if it is a plain one.
function videoExtension(asset: ImagePicker.ImagePickerAsset): string {
  const name = asset.fileName ?? asset.uri;
  const match = /\.([A-Za-z0-9]{2,4})$/.exec(name);
  return match ? match[1].toLowerCase() : 'mp4';
}

/**
 * Opens the gallery for a video and keeps a copy of it. A video over
 * MAX_VIDEO_MB is refused rather than kept: it would not fit in a backup.
 */
export async function pickPatternVideo(): Promise<PickPatternVideoResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: false,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return { status: 'canceled' };

  const picked = new File(asset.uri);
  if ((asset.fileSize ?? picked.size) > MAX_VIDEO_BYTES) {
    return { status: 'tooLarge' };
  }

  const target = folder();
  if (!target.exists) target.create({ intermediates: true });
  const videoName = `pattern-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${videoExtension(asset)}`;
  await picked.copy(fileFor(videoName));
  return { status: 'picked', videoName };
}

/** A uri a photo or a video can be shown from, or null if the file is gone. */
export function patternMediaUri(name: string): string | null {
  try {
    const file = fileFor(name);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/**
 * Best effort: a file that can't be deleted is only wasted space, never a
 * reason to fail the save or delete that let go of it.
 */
export function deletePatternMedia(name: string): void {
  try {
    const file = fileFor(name);
    if (file.exists) file.delete();
  } catch {
    // See above.
  }
}

/** Every photo and video of the catalogue on this phone, for a backup. */
export function listPatternMediaFiles(): File[] {
  const target = folder();
  if (!target.exists) return [];
  return target.list().filter((entry): entry is File => entry instanceof File);
}

/** Deletes every photo and video of the catalogue — for "delete all data". */
export function clearPatternMedia(): void {
  const target = folder();
  if (target.exists) target.delete();
  target.create({ intermediates: true });
}

/**
 * Restore: swaps the catalogue's media for the files in `staged`, which is
 * emptied. Files the backup doesn't have are gone afterwards — restore
 * replaces all data, and the restored items don't point at them.
 */
export function replacePatternMedia(staged: Directory): void {
  const target = folder();
  if (target.exists) target.delete();
  target.create({ intermediates: true });
  for (const entry of staged.list()) {
    if (entry instanceof File) entry.moveSync(new File(target, entry.name));
  }
}
