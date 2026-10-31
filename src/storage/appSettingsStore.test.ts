import { DEFAULT_SETTINGS, parseAppSettings } from './appSettingsStore';

jest.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));

describe('parseAppSettings', () => {
  it('starts in English and light', () => {
    expect(DEFAULT_SETTINGS).toEqual({ language: 'en', darkMode: false });
  });

  it('reads back what was saved', () => {
    expect(parseAppSettings('{"language":"hi","darkMode":true}')).toEqual({
      language: 'hi',
      darkMode: true,
    });
  });

  it('falls back on anything it does not know', () => {
    expect(parseAppSettings('{"language":"fr","darkMode":"yes"}')).toEqual(
      DEFAULT_SETTINGS
    );
    expect(parseAppSettings('null')).toEqual(DEFAULT_SETTINGS);
  });
});
