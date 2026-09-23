import { createSlice } from '@reduxjs/toolkit';

/**
 * Theme Slice
 * Manages theme preferences (can be used alongside Theme Context)
 */
const safeGetItem = (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } };

const initialState = {
  themePreference: safeGetItem('themePreference') || 'custom',
  systemTheme: 'light', // Detected system theme
  language: safeGetItem('language') || 'en',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemePreference: (state, action) => {
      state.themePreference = action.payload;
      localStorage.setItem('themePreference', action.payload);
    },
    setSystemTheme: (state, action) => {
      state.systemTheme = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
  },
});

export const { setThemePreference, setSystemTheme, setLanguage } = themeSlice.actions;

export default themeSlice.reducer;

