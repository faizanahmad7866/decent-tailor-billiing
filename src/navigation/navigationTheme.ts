import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

/** The navigator's colours, from the colours of the moment. */
export const navigationTheme = (dark: boolean): Theme => {
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.surface,
      text: COLORS.textPrimary,
      border: COLORS.border,
    },
  };
};
