/**
 * Theme Constants
 * Centralized theme configuration for the entire application
 * All colors, spacing, and design tokens are defined here
 * 
 * SINGLE SOURCE OF TRUTH: All colors are managed in theme/colors.js
 * 
 * Usage:
 * import { theme } from '../theme/theme.constants';
 * 
 * <div style={{ backgroundColor: theme.colors.primary }}>
 * <div className={`bg-[${theme.colors.primary}]`}>
 */

import { customTheme } from './themes/custom.theme';
import premiumColors from './colors';

// Export theme colors as constants for easy access
export const theme = {
  colors: {
    // Primary Colors - Main brand color (#1C205C)
    primary: customTheme.colors.primary.DEFAULT, // #1C205C
    primaryDark: customTheme.colors.primary.dark, // #1a1c45
    primaryLight: customTheme.colors.primary.light, // #2693b9
    
    // Secondary Colors - Supporting elements (#21598b)
    secondary: customTheme.colors.secondary.DEFAULT, // #21598b
    secondaryDark: customTheme.colors.secondary.dark,
    secondaryLight: customTheme.colors.secondary.light,
    
    // Accent Colors - Highlights and CTAs (#25b8d7)
    accent: customTheme.colors.accent.DEFAULT, // #25b8d7
    accentDark: customTheme.colors.accent.dark,
    accentLight: customTheme.colors.accent.light,
    
    // Background Colors
    background: customTheme.colors.background.primary, // #ffffff
    backgroundSecondary: customTheme.colors.background.secondary, // #f8f9fa
    backgroundTertiary: customTheme.colors.background.tertiary, // #e9ecef
    backgroundDark: customTheme.colors.background.dark, // #1a1c45
    
    // Text Colors
    textPrimary: customTheme.colors.text.primary, // #1a1c45
    textSecondary: customTheme.colors.text.secondary, // #283b61
    textTertiary: customTheme.colors.text.tertiary, // #6f7886
    textInverse: customTheme.colors.text.inverse, // #ffffff
    textDisabled: customTheme.colors.text.disabled, // #b6bdc8
    
    // Border Colors
    borderLight: customTheme.colors.border.light, // #e0e3e8
    borderDefault: customTheme.colors.border.DEFAULT, // #cbd0d8
    borderDark: customTheme.colors.border.dark, // #8c97a8
    borderFocus: customTheme.colors.border.focus, // #25b8d7
    borderPrimary: customTheme.colors.border.primary, // #1C205C
    
    // Status Colors
    success: customTheme.colors.success.DEFAULT, // #4caf50
    error: customTheme.colors.error.DEFAULT, // #f44336
    warning: customTheme.colors.warning.DEFAULT, // #ff9800
    info: customTheme.colors.info.DEFAULT, // #2377a4
    
    // Neutral Colors
    neutral: premiumColors.neutral.DEFAULT, // #8c97a8
    neutralDark: premiumColors.neutral.dark, // #283b61
    neutralLight: premiumColors.neutral.light, // #b6bdc8
    
    // Neutral Colors
    white: customTheme.colors.white, // #ffffff
    black: customTheme.colors.black, // #000000
    
    // Additional colors used in app
    yellow: '#ffc107', // Yellow for buttons
    yellow400: '#facc15', // Yellow-400
    yellow500: '#eab308', // Yellow-500
    green: '#28a745', // Green for success
    green500: '#22c55e', // Green-500
    red: '#dc3545', // Red for errors
    red50: '#fef2f2', // Red-50
    red100: '#fee2e2', // Red-100
    red600: '#dc2626', // Red-600
    blue: '#17a2b8', // Blue for info
    blue50: '#eff6ff', // Blue-50
    blue500: '#3b82f6', // Blue-500
    gray: '#808080', // Gray
    gray100: '#f3f4f6', // Gray-100
    gray200: '#e5e7eb', // Gray-200
    gray300: '#d1d5db', // Gray-300
    gray400: '#9ca3af', // Gray-400
    gray500: '#6b7280', // Gray-500
    gray600: '#4b5563', // Gray-600
    gray700: '#374151', // Gray-700
    gray900: '#111827', // Gray-900
  },
  
  // Spacing
  spacing: customTheme.spacing,
  
  // Border Radius
  borderRadius: customTheme.borderRadius,
  
  // Shadows
  boxShadow: customTheme.boxShadow,
  
  // Typography
  typography: customTheme.typography,
};

// Export as default for convenience
export default theme;

// Export individual color values for direct use
export const {
  primary,
  primaryDark,
  primaryLight,
  secondary,
  secondaryDark,
  secondaryLight,
  accent,
  accentDark,
  accentLight,
  background,
  backgroundSecondary,
  textPrimary,
  textSecondary,
  textInverse,
  white,
  black,
  success,
  error,
  warning,
  info,
} = theme.colors;

