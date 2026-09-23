/**
 * Theme Utility Functions
 * Helper functions to access theme values
 * 
 * Usage:
 * import { getThemeColor } from '../utils/theme';
 * 
 * const color = getThemeColor('primary');
 */

import { useTheme } from '../theme/theme.provider';
import themeConstants from '../theme/theme.constants';

/**
 * Get theme color value
 * @param {string} colorName - Color name (e.g., 'primary', 'background', 'textPrimary')
 * @returns {string} Color value
 */
export const getThemeColor = (colorName) => {
  return themeConstants.colors[colorName] || themeConstants.colors.primary;
};

/**
 * Hook to get theme colors
 * @returns {Object} Theme colors object
 */
export const useThemeColors = () => {
  const { theme } = useTheme();
  return {
    ...themeConstants.colors,
    // Also include theme-specific colors
    primary: theme.colors.primary.DEFAULT,
    primaryDark: theme.colors.primary.dark,
    primaryLight: theme.colors.primary.light,
  };
};

/**
 * Get CSS variable for theme color
 * @param {string} colorName - Color name
 * @returns {string} CSS variable name
 */
export const getThemeCSSVar = (colorName) => {
  const cssVarMap = {
    primary: '--color-primary',
    primaryDark: '--color-primary-dark',
    primaryLight: '--color-primary-light',
    background: '--color-background-primary',
    backgroundSecondary: '--color-background-secondary',
    textPrimary: '--color-text-primary',
    textSecondary: '--color-text-secondary',
    textInverse: '--color-text-inverse',
    white: '--color-white',
    black: '--color-black',
  };
  
  return cssVarMap[colorName] || '--color-primary';
};

// Export theme constants
export { default as theme } from '../theme/theme.constants';
export * from '../theme/theme.constants';

