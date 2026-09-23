// Dark Theme
// Uses premium color palette with lighter variants for dark mode

import premiumColors from '../colors';

export const darkTheme = {
  name: 'dark',
  colors: {
    primary: {
      DEFAULT: premiumColors.primary.light, // #2693b9 - Lighter for dark mode
      dark: premiumColors.primary.DEFAULT, // #1C205C
      light: premiumColors.accent.DEFAULT, // #25b8d7
    },
    secondary: {
      DEFAULT: premiumColors.secondary.light, // Lighter for dark mode
    },
    accent: {
      DEFAULT: premiumColors.accent.DEFAULT, // #25b8d7
    },
    white: premiumColors.white,
    black: premiumColors.black,
    background: {
      primary: premiumColors.background.dark, // #1a1c45
      secondary: '#2a2a2a',
      tertiary: '#3a3a3a',
    },
    text: {
      primary: premiumColors.white,
      secondary: '#d0d0d0',
      tertiary: premiumColors.neutral.light,
      inverse: premiumColors.background.dark,
    },
    border: {
      light: '#3a3a3a',
      DEFAULT: '#4a4a4a',
      dark: '#5a5a5a',
      focus: premiumColors.accent.DEFAULT, // #25b8d7
    },
    success: {
      DEFAULT: premiumColors.success.light,
    },
    error: {
      DEFAULT: premiumColors.error.light,
    },
    warning: {
      DEFAULT: premiumColors.warning.light,
    },
    info: {
      DEFAULT: premiumColors.info.light, // Lighter for dark mode
    },
  },
};

