import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

const ANDROID = Platform.OS === 'android';

// HapticFeedbackConstants.CONFIRM / REJECT only exist from Android 11
// (API 30). Below that the view silently does nothing, so older phones — a
// lot of the shops this app runs in — fall back to a short vibrator pattern
// for the moments that actually matter (saved, failed).
const ANDROID_HAS_CONFIRM =
  ANDROID && typeof Platform.Version === 'number' && Platform.Version >= 30;

// Haptics are a garnish, never a dependency: a build without the native
// module, a phone with the motor off, or web must never surface an error
// from a button press.
const fire = (feedback: () => Promise<void>): void => {
  try {
    feedback().catch(() => {});
  } catch {
    // ignore
  }
};

// A scan is felt through the motor itself. The camera is held out at arm's length,
// away from the screen, so a click is too faint to notice; and a click follows the
// phone's "Touch feedback" setting, which many phones have off. One firm pulse says
// the code was read, two short ones that it was refused, so the tailor can tell
// without looking.
const SCAN_READ_MS = 80;
const SCAN_REFUSED_PATTERN = [0, 70, 90, 70];

const buzz = (pattern: number | number[]): void => {
  try {
    Vibration.vibrate(pattern);
  } catch {
    // No motor on this device: the screen still says what happened.
  }
};

/**
 * The app's one tactile vocabulary. Every press, tab switch and save goes
 * through here so the whole app "clicks" the same way.
 *
 * On Android this uses the view's own haptic feedback — the same short, crisp
 * click the system keyboard and nav bar use, which also respects the phone's
 * "Touch feedback" setting — rather than the Vibrator, which on budget phones
 * reads as a rattling buzz instead of a click.
 */
export const haptics = {
  // Any ordinary button, row or card.
  tap: (): void =>
    fire(() =>
      ANDROID
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    ),
  // Moving between options — tabs, segments, chips, dates.
  select: (): void =>
    fire(() =>
      ANDROID
        ? Haptics.performAndroidHapticsAsync(
            Haptics.AndroidHaptics.Keyboard_Tap
          )
        : Haptics.selectionAsync()
    ),
  // Something was saved: cloth saved, bill made.
  success: (): void =>
    fire(() =>
      ANDROID_HAS_CONFIRM
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    ),
  // Something was refused: validation failed, save errored.
  error: (): void =>
    fire(() =>
      ANDROID_HAS_CONFIRM
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    ),
  // The camera read a good QR.
  scanRead: (): void =>
    ANDROID
      ? buzz(SCAN_READ_MS)
      : fire(() =>
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        ),
  // The camera read a QR it can't use.
  scanRefused: (): void =>
    ANDROID
      ? buzz(SCAN_REFUSED_PATTERN)
      : fire(() =>
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        ),
};
