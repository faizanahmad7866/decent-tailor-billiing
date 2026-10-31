import { parseShowroomPin } from './showroomPinStore';

jest.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));

describe('parseShowroomPin', () => {
  it('reads back a PIN', () => {
    expect(parseShowroomPin('{"pin":"4821"}')).toBe('4821');
  });

  it('asks again for anything that is not a full PIN', () => {
    expect(parseShowroomPin('{"pin":"48"}')).toBe('');
    expect(parseShowroomPin('{"pin":4821}')).toBe('');
    expect(parseShowroomPin('null')).toBe('');
  });
});
