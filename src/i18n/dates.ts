import { dayLabel, formatDate, formatDateTime } from '../utils/dates';
import { monthTitle, rangeLabel, type DateRange } from '../utils/dateRange';
import { getLanguage } from './t';

// Dates as a screen shows them, in the app's language. A bill printed or sent to
// a customer uses utils/dates directly, so it stays as it is in either language.

const HINDI_WORDS: Record<string, string> = {
  January: 'जनवरी',
  February: 'फ़रवरी',
  March: 'मार्च',
  April: 'अप्रैल',
  May: 'मई',
  June: 'जून',
  July: 'जुलाई',
  August: 'अगस्त',
  September: 'सितंबर',
  October: 'अक्टूबर',
  November: 'नवंबर',
  December: 'दिसंबर',
  Jan: 'जन',
  Feb: 'फ़र',
  Mar: 'मार्च',
  Apr: 'अप्रैल',
  Jun: 'जून',
  Jul: 'जुल',
  Aug: 'अग',
  Sep: 'सित',
  Oct: 'अक्टू',
  Nov: 'नव',
  Dec: 'दिस',
  Today: 'आज',
  Yesterday: 'कल',
};

const localized = (text: string): string =>
  getLanguage() === 'hi'
    ? text.replace(/[A-Za-z]+/g, (word) => HINDI_WORDS[word] ?? word)
    : text;

export const shownDate = (iso: string): string => localized(formatDate(iso));

export const shownDateTime = (iso: string): string =>
  localized(formatDateTime(iso));

export const shownDay = (iso: string, now?: Date): string =>
  localized(dayLabel(iso, now));

export const shownMonth = (year: number, month: number): string =>
  localized(monthTitle(year, month));

export const shownRange = (range: DateRange, now?: Date): string =>
  localized(rangeLabel(range, now));
