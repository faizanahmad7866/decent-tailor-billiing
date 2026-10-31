import * as Speech from 'expo-speech';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
}));
const mockLoad = jest.fn();
const mockSave = jest.fn();
jest.mock('../storage/voiceStore', () => ({
  loadVoiceEnabled: () => mockLoad(),
  saveVoiceEnabled: (on: boolean) => mockSave(on),
}));

// The voice module and the speech mock it talks to, from one fresh registry,
// as the app starts with the voice on or off.
function fresh(enabledAtStart: boolean): {
  voice: typeof import('./voice');
  speech: typeof Speech;
} {
  mockLoad.mockReturnValue(enabledAtStart);
  let loaded!: { voice: typeof import('./voice'); speech: typeof Speech };
  jest.isolateModules(() => {
    loaded = {
      voice: require('./voice'),
      speech: require('expo-speech'),
    };
  });
  return loaded;
}

describe('voice', () => {
  beforeEach(() => jest.clearAllMocks());

  it('speaks in Hindi, cutting off what was being said', () => {
    const { voice, speech } = fresh(true);
    voice.speak('5 मीटर');
    expect(speech.stop).toHaveBeenCalled();
    expect(speech.speak).toHaveBeenCalledWith('5 मीटर', {
      language: 'hi-IN',
      rate: 0.95,
    });
  });

  it('is silent while switched off', () => {
    const { voice, speech } = fresh(false);
    voice.speak('5 मीटर');
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it('remembers the switch, and says so when turned on', () => {
    const { voice, speech } = fresh(false);
    voice.setVoiceEnabled(true);
    expect(voice.isVoiceEnabled()).toBe(true);
    expect(mockSave).toHaveBeenCalledWith(true);
    expect(speech.speak).toHaveBeenCalledWith(
      'आवाज़ चालू है',
      expect.any(Object)
    );
  });

  it('stops speaking when turned off', () => {
    const { voice, speech } = fresh(true);
    voice.setVoiceEnabled(false);
    expect(voice.isVoiceEnabled()).toBe(false);
    expect(mockSave).toHaveBeenCalledWith(false);
    expect(speech.stop).toHaveBeenCalled();
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it('speaks for a screen with its own switch, even while switched off', () => {
    const { voice, speech } = fresh(false);
    const onEnd = jest.fn();
    voice.speakAlways('स्वागत है', onEnd);
    // Over whether said in full, cut off, or failed: the showroom waits on it.
    expect(speech.speak).toHaveBeenCalledWith('स्वागत है', {
      language: 'hi-IN',
      rate: 0.95,
      onDone: onEnd,
      onStopped: onEnd,
      onError: onEnd,
    });
  });

  it('keeps going if the voice cannot speak', () => {
    const { voice, speech } = fresh(true);
    (speech.speak as jest.Mock).mockImplementationOnce(() => {
      throw new Error('no engine');
    });
    expect(() => voice.speak('x')).not.toThrow();
  });
});
