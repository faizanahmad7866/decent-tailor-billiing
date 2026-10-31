import { useSyncExternalStore } from 'react';
import * as Speech from 'expo-speech';
import { loadVoiceEnabled, saveVoiceEnabled } from '../storage/voiceStore';
import { VOICE_ON_LINE } from './spokenText';

// The app's voice, as the main Decent Tailor app has one: the phone's own
// text-to-speech, a touch slower than normal, and off at the tailor's word in
// Settings. In Hindi, as the shop speaks.

const LANGUAGE = 'hi-IN';
const RATE = 0.95;

let enabled = loadVoiceEnabled();
const listeners = new Set<() => void>();

/** Whether the app speaks. */
export function isVoiceEnabled(): boolean {
  return enabled;
}

/** Turns the voice on or off, remembers it, and says so when turned on. */
export function setVoiceEnabled(on: boolean): void {
  if (on === enabled) return;
  enabled = on;
  try {
    saveVoiceEnabled(on);
  } catch {
    // Not remembered: it still holds until the app is closed.
  }
  listeners.forEach((listener) => listener());
  if (on) speak(VOICE_ON_LINE);
  else stopSpeaking();
}

/**
 * Says `text` now, cutting off whatever was being said — the newest figure is
 * the one that matters. Silent when the voice is off, and never throws: a
 * voice must not get in the way of a bill.
 */
export function speak(text: string): void {
  if (enabled) speakAlways(text);
}

/**
 * Says `text` whatever the Settings switch says, for a screen with a voice switch
 * of its own (the showroom's welcome). Cuts off what was being said and never
 * throws, as `speak`. `onDone` runs once the line has been said in full, not when
 * it is cut off.
 */
export function speakAlways(text: string, onDone?: () => void): void {
  try {
    void Speech.stop();
    Speech.speak(text, { language: LANGUAGE, rate: RATE, onDone });
  } catch {
    // No voice on this phone: nothing to say it with.
  }
}

export function stopSpeaking(): void {
  try {
    void Speech.stop();
  } catch {
    // Nothing was speaking.
  }
}

/** The voice switch, for a screen that shows it. */
export function useVoiceEnabled(): boolean {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, isVoiceEnabled);
}
