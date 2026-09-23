/**
 * Premium Color Palette
 * All colors are centralized here for easy management
 * Based on premium blue color scheme analysis
 * 
 * Color Analysis:
 * - #1C205C: Dark navy blue (Primary - main brand color)
 * - #25b8d7: Bright cyan (Accent - highlights, CTAs)
 * - #21598b: Medium blue (Secondary - supporting elements)
 * - #1a1c45: Very dark navy (Primary Dark - darker variants)
 * - #2693b9: Bright blue (Primary Light - lighter variants)
 * - #283b61: Dark blue-gray (Neutral dark - borders, shadows)
 * - #2377a4: Medium blue (Info - informational elements)
 */

export const premiumColors = {
  // Primary Brand Colors
  primary: {
    50: '#e6e8f0',
    100: '#bcc1d9',
    200: '#929ac2',
    300: '#6873ab',
    400: '#3e4c94',
    500: '#1C205C', // Main brand color
    600: '#161a4a',
    700: '#101338',
    800: '#0a0d26',
    900: '#040714',
    DEFAULT: '#1C205C',
    dark: '#1a1c45',
    light: '#2693b9',
  },

  // Secondary Colors
  secondary: {
    50: '#e6f0f5',
    100: '#b3d4e3',
    200: '#80b8d1',
    300: '#4d9cbf',
    400: '#1a80ad',
    500: '#21598b', // Secondary main
    600: '#1a4770',
    700: '#133555',
    800: '#0d233a',
    900: '#06111f',
    DEFAULT: '#21598b',
    dark: '#1a4770',
    light: '#4d9cbf',
  },

  // Accent Colors (Bright Cyan)
  accent: {
    50: '#e5f8fc',
    100: '#b3e9f5',
    200: '#80daee',
    300: '#4dcbe7',
    400: '#1abce0',
    500: '#25b8d7', // Accent main
    600: '#1e93ac',
    700: '#176e81',
    800: '#104956',
    900: '#09242b',
    DEFAULT: '#25b8d7',
    dark: '#1e93ac',
    light: '#4dcbe7',
  },

  // Info Colors
  info: {
    50: '#e6f0f7',
    100: '#b3d1e5',
    200: '#80b2d3',
    300: '#4d93c1',
    400: '#1a74af',
    500: '#2377a4', // Info main
    600: '#1c5f83',
    700: '#154762',
    800: '#0e2f41',
    900: '#071720',
    DEFAULT: '#2377a4',
    dark: '#1c5f83',
    light: '#4d93c1',
  },

  // Neutral Colors
  neutral: {
    50: '#f5f6f8',
    100: '#e0e3e8',
    200: '#cbd0d8',
    300: '#b6bdc8',
    400: '#a1aab8',
    500: '#8c97a8',
    600: '#6f7886',
    700: '#525964',
    800: '#353a42',
    900: '#181b20',
    DEFAULT: '#8c97a8',
    dark: '#283b61',
    light: '#b6bdc8',
  },

  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#e9ecef',
    dark: '#1a1c45',
    light: '#f5f6f8',
  },

  // Text Colors
  text: {
    primary: '#1a1c45',
    secondary: '#283b61',
    tertiary: '#6f7886',
    inverse: '#ffffff',
    disabled: '#b6bdc8',
    onPrimary: '#ffffff',
    onAccent: '#1a1c45',
  },

  // Border Colors
  border: {
    light: '#e0e3e8',
    DEFAULT: '#cbd0d8',
    dark: '#8c97a8',
    focus: '#25b8d7',
    primary: '#1C205C',
  },

  // Status Colors
  success: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
    DEFAULT: '#4caf50',
    dark: '#388e3c',
    light: '#81c784',
  },

  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
    DEFAULT: '#f44336',
    dark: '#d32f2f',
    light: '#e57373',
  },

  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
    DEFAULT: '#ff9800',
    dark: '#f57c00',
    light: '#ffb74d',
  },

  // Base Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Export color palette as default
export default premiumColors;

