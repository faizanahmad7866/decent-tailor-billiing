import { useFonts } from 'expo-font';
import {
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { Inter_300Light } from '@expo-google-fonts/inter';

/**
 * The showroom's own faces — the serif and Inter Light — loaded when the
 * showroom is set up rather than at every start of the app, which a bill does
 * not wait on. True once they are in, or have failed: a face that fails falls
 * back to the phone's own, which is no reason to keep the showroom closed.
 */
export function useShowroomFonts(): boolean {
  const [loaded, error] = useFonts({
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    Inter_300Light,
  });
  return loaded || error !== null;
}
