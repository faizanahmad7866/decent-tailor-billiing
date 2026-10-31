import { createNarrator } from './narrator';

const LINES = ['स्वागत है', 'यह कैटलॉग है'];
const TIMING = { pauseMs: 3000, repeatMs: 120000 };

// A voice that holds each line until told it is over, as a phone's does while it
// speaks. `end` finishes the newest line, as a cut-off line ends when the next
// one starts.
function fakeVoice(): {
  say: jest.Mock;
  end: () => void;
  said: () => string[];
} {
  const ends: (() => void)[] = [];
  const say = jest.fn((_text: string, onEnd: () => void) => {
    ends.push(onEnd);
  });
  return {
    say,
    end: () => ends[ends.length - 1]?.(),
    said: () => say.mock.calls.map(([text]) => text as string),
  };
}

describe('createNarrator', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('says the greeting at once, then the next line 3 s after it ends', () => {
    const voice = fakeVoice();
    createNarrator(LINES, voice.say, { pauseMs: 3000 }).start();
    expect(voice.said()).toEqual(['स्वागत है']);

    // Still being said: the pause has not begun.
    jest.advanceTimersByTime(5000);
    expect(voice.said()).toHaveLength(1);

    voice.end();
    jest.advanceTimersByTime(2999);
    expect(voice.said()).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(voice.said()).toEqual(LINES);

    // Once only, without a repeat.
    voice.end();
    jest.advanceTimersByTime(600000);
    expect(voice.said()).toHaveLength(2);
  });

  it('says the whole welcome again 2 minutes after it ends, and on', () => {
    const voice = fakeVoice();
    createNarrator(LINES, voice.say, TIMING).start();
    voice.end();
    jest.advanceTimersByTime(3000);
    voice.end();
    jest.advanceTimersByTime(119999);
    expect(voice.said()).toHaveLength(2);
    jest.advanceTimersByTime(1);
    expect(voice.said()).toEqual([...LINES, LINES[0]]);
    voice.end();
    jest.advanceTimersByTime(3000);
    voice.end();
    jest.advanceTimersByTime(120000);
    expect(voice.said()).toHaveLength(5);
  });

  it('reads an offer between rounds, leaving the next round where it was', () => {
    const voice = fakeVoice();
    const narrator = createNarrator(LINES, voice.say, TIMING);
    narrator.start();
    voice.end();
    jest.advanceTimersByTime(3000);
    voice.end();
    jest.advanceTimersByTime(30000);
    narrator.announce('ईद ऑफर');
    voice.end();
    jest.advanceTimersByTime(89999);
    expect(voice.said()).toEqual([...LINES, 'ईद ऑफर']);
    jest.advanceTimersByTime(1);
    expect(voice.said()).toEqual([...LINES, 'ईद ऑफर', LINES[0]]);
  });

  it('cuts into a welcome line, then says that line again after the offer', () => {
    const voice = fakeVoice();
    const narrator = createNarrator(LINES, voice.say, TIMING);
    narrator.start();
    voice.end();
    jest.advanceTimersByTime(3000);
    // The second line is being said when the offer comes up.
    narrator.announce('ईद ऑफर');
    expect(voice.said()).toEqual([...LINES, 'ईद ऑफर']);
    voice.end();
    jest.advanceTimersByTime(2999);
    expect(voice.said()).toHaveLength(3);
    jest.advanceTimersByTime(1);
    expect(voice.said()).toEqual([...LINES, 'ईद ऑफर', LINES[1]]);
    // And the round then comes back on time.
    voice.end();
    jest.advanceTimersByTime(120000);
    expect(voice.said()).toHaveLength(5);
  });

  it('holds a welcome line that falls due while an offer is read', () => {
    const voice = fakeVoice();
    const narrator = createNarrator(LINES, voice.say, TIMING);
    narrator.start();
    voice.end();
    // In the pause between the lines.
    jest.advanceTimersByTime(1000);
    narrator.announce('ईद ऑफर');
    jest.advanceTimersByTime(5000);
    expect(voice.said()).toEqual([LINES[0], 'ईद ऑफर']);
    voice.end();
    jest.advanceTimersByTime(3000);
    expect(voice.said()).toEqual([LINES[0], 'ईद ऑफर', LINES[1]]);
  });

  it('lets the newest offer cut the one before', () => {
    const voice = fakeVoice();
    const narrator = createNarrator([], voice.say, TIMING);
    narrator.announce('ईद ऑफर');
    narrator.announce('दिवाली ऑफर');
    expect(voice.said()).toEqual(['ईद ऑफर', 'दिवाली ऑफर']);
  });

  it('drops everything still to come once cancelled', () => {
    const voice = fakeVoice();
    const narrator = createNarrator(LINES, voice.say, TIMING);
    narrator.start();
    narrator.cancel();
    // A line reported over after the showroom closed.
    voice.end();
    narrator.announce('ईद ऑफर');
    jest.advanceTimersByTime(600000);
    expect(voice.said()).toEqual([LINES[0]]);
  });
});
