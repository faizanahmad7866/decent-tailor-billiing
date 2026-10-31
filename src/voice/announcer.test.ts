import { createAnnouncer } from './announcer';

describe('createAnnouncer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('says only the last figure of a burst, after the pause', () => {
    const speak = jest.fn();
    const announcer = createAnnouncer(speak, 700);
    announcer.say('2 मीटर');
    jest.advanceTimersByTime(300);
    announcer.say('2.5 मीटर');
    jest.advanceTimersByTime(699);
    expect(speak).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledWith('2.5 मीटर');
  });

  it('does not repeat a line straight after itself', () => {
    const speak = jest.fn();
    const announcer = createAnnouncer(speak, 700);
    announcer.say('5 मीटर');
    jest.advanceTimersByTime(700);
    announcer.say('5 मीटर');
    jest.advanceTimersByTime(700);
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('says a figure again once it was cleared and typed anew', () => {
    const speak = jest.fn();
    const announcer = createAnnouncer(speak, 700);
    announcer.say('5 मीटर');
    jest.advanceTimersByTime(700);
    announcer.say(null);
    announcer.say('5 मीटर');
    jest.advanceTimersByTime(700);
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it('drops what was waiting when cleared or cancelled', () => {
    const speak = jest.fn();
    const announcer = createAnnouncer(speak, 700);
    announcer.say('5 मीटर');
    announcer.say(null);
    jest.advanceTimersByTime(1000);
    announcer.say('3 मीटर');
    announcer.cancel();
    jest.advanceTimersByTime(1000);
    expect(speak).not.toHaveBeenCalled();
  });
});
