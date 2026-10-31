import { createIdleClock } from './showroomIdle';

const TIMING = { idleMs: 90000, warnMs: 10000 };

function clock(): {
  onWarn: jest.Mock;
  onTimeout: jest.Mock;
  idle: ReturnType<typeof createIdleClock>;
} {
  const onWarn = jest.fn();
  const onTimeout = jest.fn();
  return {
    onWarn,
    onTimeout,
    idle: createIdleClock(TIMING, { onWarn, onTimeout }),
  };
}

describe('createIdleClock', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('asks after a quiet spell, counts down the seconds, then starts over', () => {
    const { onWarn, onTimeout } = clock();
    jest.advanceTimersByTime(79999);
    expect(onWarn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onWarn).toHaveBeenLastCalledWith(10);
    jest.advanceTimersByTime(1000);
    expect(onWarn).toHaveBeenLastCalledWith(9);
    jest.advanceTimersByTime(8000);
    expect(onWarn).toHaveBeenLastCalledWith(1);
    expect(onTimeout).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(onWarn).toHaveBeenCalledTimes(10);
  });

  it('puts the clock back to the start on a touch', () => {
    const { onWarn, onTimeout, idle } = clock();
    jest.advanceTimersByTime(70000);
    idle.poke();
    jest.advanceTimersByTime(79999);
    expect(onWarn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(20001);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('puts the question away when it is answered', () => {
    const { onWarn, onTimeout, idle } = clock();
    jest.advanceTimersByTime(83000);
    expect(onWarn).toHaveBeenLastCalledWith(7);
    idle.poke();
    expect(onWarn).toHaveBeenLastCalledWith(null);
    jest.advanceTimersByTime(60000);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('does nothing more once stopped, and puts the question away', () => {
    const { onWarn, onTimeout, idle } = clock();
    jest.advanceTimersByTime(85000);
    idle.stop();
    expect(onWarn).toHaveBeenLastCalledWith(null);
    idle.poke();
    jest.advanceTimersByTime(600000);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('starts over once only, however it is touched after', () => {
    const { onTimeout, idle } = clock();
    jest.advanceTimersByTime(90000);
    idle.poke();
    jest.advanceTimersByTime(600000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
