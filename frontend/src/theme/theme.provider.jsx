import { createContext, useContext, useState, useEffect } from 'react';
import { themeConfig } from './theme.config';
import { customTheme } from './themes/custom.theme';
import { lightTheme } from './themes/light.theme';
import { darkTheme } from './themes/dark.theme';

// Theme context
const ThemeContext = createContext(null);

// Available themes
const themes = {
  custom: customTheme,
  light: lightTheme,
  dark: darkTheme,
};

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or use default
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(themeConfig.storageKey);
      if (savedTheme && themes[savedTheme]) {
        return savedTheme;
      }
    }
    return themeConfig.defaultTheme;
  };

  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);
  const [theme, setTheme] = useState(themes[currentTheme]);

  // Update theme when currentTheme changes
  useEffect(() => {
    const selectedTheme = themes[currentTheme] || themes[themeConfig.defaultTheme];
    setTheme(selectedTheme);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(themeConfig.storageKey, currentTheme);
    }

    // Apply CSS variables
    applyThemeVariables(selectedTheme);
  }, [currentTheme]);

  // Apply theme variables to document root
  const applyThemeVariables = (selectedTheme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const colors = selectedTheme.colors;

      // Primary colors
      root.style.setProperty('--color-primary', colors.primary.DEFAULT);
      root.style.setProperty('--color-primary-dark', colors.primary.dark);
      root.style.setProperty('--color-primary-light', colors.primary.light);

      // Background colors
      root.style.setProperty('--color-background-primary', colors.background.primary);
      root.style.setProperty('--color-background-secondary', colors.background.secondary);
      root.style.setProperty('--color-background-tertiary', colors.background.tertiary);

      // Text colors
      root.style.setProperty('--color-text-primary', colors.text.primary);
      root.style.setProperty('--color-text-secondary', colors.text.secondary);
      root.style.setProperty('--color-text-tertiary', colors.text.tertiary);
      root.style.setProperty('--color-text-inverse', colors.text.inverse);

      // Border colors
      root.style.setProperty('--color-border-light', colors.border.light);
      root.style.setProperty('--color-border-default', colors.border.DEFAULT);
      root.style.setProperty('--color-border-dark', colors.border.dark);
      root.style.setProperty('--color-border-focus', colors.border.focus);

      // Status colors
      root.style.setProperty('--color-success', colors.success.DEFAULT);
      root.style.setProperty('--color-error', colors.error.DEFAULT);
      root.style.setProperty('--color-warning', colors.warning.DEFAULT);
      root.style.setProperty('--color-info', colors.info.DEFAULT);

      // White and black
      root.style.setProperty('--color-white', colors.white);
      root.style.setProperty('--color-black', colors.black);
      
      // Additional theme colors for inline styles
      root.style.setProperty('--theme-primary', colors.primary.DEFAULT);
      root.style.setProperty('--theme-primary-dark', colors.primary.dark);
      root.style.setProperty('--theme-primary-light', colors.primary.light);
      root.style.setProperty('--theme-background', colors.background.primary);
      root.style.setProperty('--theme-text-primary', colors.text.primary);
      root.style.setProperty('--theme-text-inverse', colors.text.inverse);
    }
  };

  // Switch theme
  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  // Toggle between light and dark (if needed)
  const toggleTheme = () => {
    if (currentTheme === 'dark') {
      switchTheme('custom');
    } else {
      switchTheme('dark');
    }
  };

  const value = {
    theme,
    currentTheme,
    switchTheme,
    toggleTheme,
    availableThemes: Object.keys(themes),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

