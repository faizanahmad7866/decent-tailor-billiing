import type { ImageSourcePropType } from 'react-native';

// The garment pictures and Hindi names the main Decent Tailor app uses, so a
// garment looks and reads the same in both apps. Keyed by lower-case name;
// a garment the tailor typed in themselves simply has neither.

export const GARMENT_IMAGES: Record<string, ImageSourcePropType> = {
  shirt: require('../../assets/garments/shirt.jpg'),
  pant: require('../../assets/garments/pant.png'),
  kurta: require('../../assets/garments/kurta.png'),
  pajama: require('../../assets/garments/pajama.png'),
  'kurta pajama': require('../../assets/garments/kurta-pajama.jpg'),
  pathani: require('../../assets/garments/pathani.png'),
  salwar: require('../../assets/garments/salwar.jpeg'),
  coat: require('../../assets/garments/coat.png'),
  sadri: require('../../assets/garments/sadri.png'),
  'v-jacket': require('../../assets/garments/v-jacket.png'),
  jodhpuri: require('../../assets/garments/jodhpuri.png'),
  'long jacket': require('../../assets/garments/long-jacket.png'),
  'indo western': require('../../assets/garments/indo-western.png'),
};

export const GARMENT_HINDI_NAMES: Record<string, string> = {
  shirt: 'कमीज़',
  pant: 'पैंट',
  kurta: 'कुर्ता',
  pajama: 'पजामा',
  'kurta pajama': 'कुर्ता पजामा',
  pathani: 'पठानी',
  salwar: 'सलवार',
  coat: 'कोट',
  sadri: 'सदरी',
  'v-jacket': 'वी-जैकेट',
  jodhpuri: 'जोधपुरी',
  'long jacket': 'लॉन्ग जैकेट',
  'indo western': 'इंडो वेस्टर्न',
};

export const garmentKey = (name: string): string => name.trim().toLowerCase();
