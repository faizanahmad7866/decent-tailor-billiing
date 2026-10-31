import { designHindi } from '../utils/designHindi';
import { getLanguage } from './t';

/** A category's name as a screen shows it: in Hindi when the app is, if known. */
export const shownCategory = (name: string): string =>
  getLanguage() === 'hi' ? designHindi(name) || name : name;

const DEVANAGARI = /[\u0900-\u097F]/;

/** Whether text is written in Hindi, which letter-spacing would break apart. */
export const isHindiText = (text: string): boolean => DEVANAGARI.test(text);
