// Light Theme (Default fallback)
// Uses premium color palette

import premiumColors from '../colors';

export const lightTheme = {
  name: 'light',
  colors: {
    primary: {
      DEFAULT: premiumColors.primary.DEFAULT, // #1C205C
      dark: premiumColors.primary.dark, // #1a1c45
      light: premiumColors.primary.light, // #2693b9
    },
    secondary: {
      DEFAULT: premiumColors.secondary.DEFAULT, // #21598b
    },
    accent: {
      DEFAULT: premiumColors.accent.DEFAULT, // #25b8d7
    },
    white: premiumColors.white,
    black: premiumColors.black,
    background: {
      primary: premiumColors.background.primary,
      secondary: premiumColors.background.secondary,
      tertiary: premiumColors.background.tertiary,
    },
    text: {
      primary: premiumColors.text.primary,
      secondary: premiumColors.text.secondary,
      tertiary: premiumColors.text.tertiary,
      inverse: premiumColors.text.inverse,
    },
    border: {
      light: premiumColors.border.light,
      DEFAULT: premiumColors.border.DEFAULT,
      dark: premiumColors.border.dark,
      focus: premiumColors.border.focus, // #25b8d7
    },
    success: {
      DEFAULT: premiumColors.success.DEFAULT,
    },
    error: {
      DEFAULT: premiumColors.error.DEFAULT,
    },
    warning: {
      DEFAULT: premiumColors.warning.DEFAULT,
    },
    info: {
      DEFAULT: premiumColors.info.DEFAULT, // #2377a4
    },
  },
};

