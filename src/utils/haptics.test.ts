import { Vibration } from 'react-native';
import { haptics } from './haptics';

jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 33 },
  Vibration: { vibrate: jest.fn() },
}));

jest.mock('expo-haptics', () => ({}));

const vibrate = Vibration.vibrate as jest.Mock;

describe('haptics on a scan', () => {
  beforeEach(() => vibrate.mockReset());

  it('gives one firm pulse for a good code', () => {
    haptics.scanRead();
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(80);
  });

  it('gives two short pulses for a refused code, so the two feel different', () => {
    haptics.scanRefused();
    expect(vibrate).toHaveBeenCalledWith([0, 70, 90, 70]);
  });

  it('never lets a phone with no motor get in the way of a scan', () => {
    vibrate.mockImplementation(() => {
      throw new Error('no vibrator');
    });
    expect(() => haptics.scanRead()).not.toThrow();
    expect(() => haptics.scanRefused()).not.toThrow();
  });
});
