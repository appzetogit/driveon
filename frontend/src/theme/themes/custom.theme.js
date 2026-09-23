// Premium Theme - Centralized Color Management
// All colors imported from colors.js for single source of truth
// Primary: #1C205C, Accent: #25b8d7, Secondary: #21598b

import premiumColors from '../colors';

export const customTheme = {
  name: 'custom',
  colors: {
    // Primary Colors - Main brand color (#1C205C)
    primary: {
      50: premiumColors.primary[50],
      100: premiumColors.primary[100],
      200: premiumColors.primary[200],
      300: premiumColors.primary[300],
      400: premiumColors.primary[400],
      500: premiumColors.primary[500],
      600: premiumColors.primary[600],
      700: premiumColors.primary[700],
      800: premiumColors.primary[800],
      900: premiumColors.primary[900],
      DEFAULT: premiumColors.primary.DEFAULT, // #1C205C
      dark: premiumColors.primary.dark, // #1a1c45
      light: premiumColors.primary.light, // #2693b9
    },
    
    // Secondary Colors - Supporting elements (#21598b)
    secondary: {
      50: premiumColors.secondary[50],
      100: premiumColors.secondary[100],
      200: premiumColors.secondary[200],
      300: premiumColors.secondary[300],
      400: premiumColors.secondary[400],
      500: premiumColors.secondary[500],
      600: premiumColors.secondary[600],
      700: premiumColors.secondary[700],
      800: premiumColors.secondary[800],
      900: premiumColors.secondary[900],
      DEFAULT: premiumColors.secondary.DEFAULT, // #21598b
      dark: premiumColors.secondary.dark,
      light: premiumColors.secondary.light,
    },

    // Accent Colors - Highlights and CTAs (#25b8d7)
    accent: {
      50: premiumColors.accent[50],
      100: premiumColors.accent[100],
      200: premiumColors.accent[200],
      300: premiumColors.accent[300],
      400: premiumColors.accent[400],
      500: premiumColors.accent[500],
      600: premiumColors.accent[600],
      700: premiumColors.accent[700],
      800: premiumColors.accent[800],
      900: premiumColors.accent[900],
      DEFAULT: premiumColors.accent.DEFAULT, // #25b8d7
      dark: premiumColors.accent.dark,
      light: premiumColors.accent.light,
    },

    // Neutral Colors
    white: premiumColors.white,
    black: premiumColors.black,
    
    // Background Colors
    background: {
      primary: premiumColors.background.primary,
      secondary: premiumColors.background.secondary,
      tertiary: premiumColors.background.tertiary,
      dark: premiumColors.background.dark,
    },

    // Text Colors
    text: {
      primary: premiumColors.text.primary,
      secondary: premiumColors.text.secondary,
      tertiary: premiumColors.text.tertiary,
      inverse: premiumColors.text.inverse,
      disabled: premiumColors.text.disabled,
    },

    // Border Colors
    border: {
      light: premiumColors.border.light,
      DEFAULT: premiumColors.border.DEFAULT,
      dark: premiumColors.border.dark,
      focus: premiumColors.border.focus, // #25b8d7
    },

    // Status Colors
    success: {
      light: premiumColors.success.light,
      DEFAULT: premiumColors.success.DEFAULT,
      dark: premiumColors.success.dark,
    },
    error: {
      light: premiumColors.error.light,
      DEFAULT: premiumColors.error.DEFAULT,
      dark: premiumColors.error.dark,
    },
    warning: {
      light: premiumColors.warning.light,
      DEFAULT: premiumColors.warning.DEFAULT,
      dark: premiumColors.warning.dark,
    },
    info: {
      light: premiumColors.info.light,
      DEFAULT: premiumColors.info.DEFAULT, // #2377a4
      dark: premiumColors.info.dark,
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      serif: ['Georgia', 'serif'],
      mono: ['Menlo', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Spacing (Mobile-first)
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Shadows (Mobile-optimized)
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },

  // Transitions
  transition: {
    duration: {
      fast: '150ms',
      DEFAULT: '200ms',
      slow: '300ms',
    },
    timing: {
      DEFAULT: 'ease-in-out',
      in: 'ease-in',
      out: 'ease-out',
    },
  },

  // Breakpoints (Mobile-first)
  breakpoints: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};
