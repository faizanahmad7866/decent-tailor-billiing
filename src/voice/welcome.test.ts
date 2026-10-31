import { createWelcome } from './welcome';

const LINES = ['स्वागत है', 'यह कैटलॉग है'];

// A voice that says each line at once and reports it done when told to.
function fakeVoice(): {
  say: jest.Mock;
  finish: () => void;
} {
  const pending: (() => void)[] = [];
  const say = jest.fn((_text: string, onDone: () => void) => {
    pending.push(onDone);
  });
  return { say, finish: () => pending.shift()?.() };
}

describe('createWelcome', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('says the greeting at once, then the next line 3 s after it ends', () => {
    const voice = fakeVoice();
    const welcome = createWelcome(LINES, voice.say, 3000);
    welcome.start();
    expect(voice.say).toHaveBeenCalledTimes(1);
    expect(voice.say).toHaveBeenLastCalledWith(
      'स्वागत है',
      expect.any(Function)
    );

    // Still being said: the pause has not begun.
    jest.advanceTimersByTime(5000);
    expect(voice.say).toHaveBeenCalledTimes(1);

    voice.finish();
    jest.advanceTimersByTime(2999);
    expect(voice.say).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(voice.say).toHaveBeenCalledTimes(2);
    expect(voice.say).toHaveBeenLastCalledWith(
      'यह कैटलॉग है',
      expect.any(Function)
    );

    // Nothing after the last line.
    voice.finish();
    jest.advanceTimersByTime(10000);
    expect(voice.say).toHaveBeenCalledTimes(2);
  });

  it('drops the next line when cancelled during the pause', () => {
    const voice = fakeVoice();
    const welcome = createWelcome(LINES, voice.say, 3000);
    welcome.start();
    voice.finish();
    welcome.cancel();
    jest.advanceTimersByTime(10000);
    expect(voice.say).toHaveBeenCalledTimes(1);
  });

  it('ignores a line reported done after it was cancelled', () => {
    const voice = fakeVoice();
    const welcome = createWelcome(LINES, voice.say, 3000);
    welcome.start();
    welcome.cancel();
    voice.finish();
    jest.advanceTimersByTime(10000);
    expect(voice.say).toHaveBeenCalledTimes(1);
  });

  it('says nothing for no lines', () => {
    const voice = fakeVoice();
    createWelcome([], voice.say, 3000).start();
    expect(voice.say).not.toHaveBeenCalled();
  });
});
