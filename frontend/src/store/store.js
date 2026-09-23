import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import carSlice from './slices/carSlice';
import bookingSlice from './slices/bookingSlice';
import themeSlice from './slices/themeSlice';

/**
 * Redux Store Configuration
 * Centralized state management for the app
 */
export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    car: carSlice,
    booking: bookingSlice,
    theme: themeSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: import.meta.env.DEV, // Enable Redux DevTools in development
});

// Type definitions for TypeScript (if using TS, uncomment these)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

