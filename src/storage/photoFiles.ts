import { Directory, File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { cropToPixels, type CropBox } from '../utils/photoCrop';

// What picking and keeping a photo takes, shared by every kind of photo the
// app keeps — a cloth's, a pattern's. Each store decides its own folder and
// names; this does the picking and the shrinking.

export type PhotoSource = 'camera' | 'gallery';

export type PickedPhoto =
  | { status: 'picked'; asset: ImagePicker.ImagePickerAsset }
  | { status: 'canceled' }
  | { status: 'denied' };

const JPEG_QUALITY = 0.8;

/**
 * Opens the camera or the gallery. Only the camera asks for permission — the
 * system photo picker runs outside the app.
 */
export async function pickPhotoAsset(
  source: PhotoSource
): Promise<PickedPhoto> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { status: 'picked', asset } : { status: 'canceled' };
}

// The photo's size as it actually loads, turned the right way up: what a picker
// reports can be before the turn, and a crop on those figures would cut the wrong part.
async function loadedSize(
  uri: string
): Promise<{ width: number; height: number }> {
  const context = ImageManipulator.manipulate(uri);
  try {
    const rendered = await context.renderAsync();
    try {
      return { width: rendered.width, height: rendered.height };
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}

/**
 * Keeps a shrunk JPEG copy of a photo in `directory`, and returns its file name —
 * `prefix`, the time and a random tail, so two photos never collide. With a `crop`,
 * only that part of it, cut from the photo at its full size, so a small part stays
 * sharp. The longest edge of what is kept is cut to `maxEdge`.
 */
export async function saveResizedJpeg(
  photo: Pick<ImagePicker.ImagePickerAsset, 'uri' | 'width' | 'height'>,
  directory: Directory,
  prefix: string,
  maxEdge: number,
  crop: CropBox | null = null
): Promise<string> {
  const { uri } = photo;
  let { width, height } = photo;
  let part = null;
  if (crop) {
    const size = await loadedSize(uri);
    part = cropToPixels(crop, size.width, size.height);
  }
  const context = ImageManipulator.manipulate(uri);
  try {
    if (part) {
      context.crop(part);
      ({ width, height } = part);
    }
    if (Math.max(width, height) > maxEdge) {
      context.resize(
        width >= height ? { width: maxEdge } : { height: maxEdge }
      );
    }
    const rendered = await context.renderAsync();
    try {
      const saved = await rendered.saveAsync({
        compress: JPEG_QUALITY,
        format: SaveFormat.JPEG,
      });

      if (!directory.exists) directory.create({ intermediates: true });

      const fileName = `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.jpg`;
      await new File(saved.uri).move(new File(directory, fileName));
      return fileName;
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}
