import React from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { store } from './store/store';
import { queryClient } from './config/reactQuery';
import { AdminProvider } from './context/AdminContext';
import router from './routes';
import Toaster from './components/common/Toaster';
import AuthInitializer from './components/auth/AuthInitializer';
import { EmployeeProvider } from './context/EmployeeContext';
import './App.css';

/**
 * Detect iOS device (iPhone, iPad, iPod)
 * Used to disable problematic animations that cause blank screens in iOS WebViews
 */
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

/**
 * Main App Component
 * Wraps the app with Redux Provider, React Query Provider, Admin Provider, Employee Provider, Router, and Toaster
 */
function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AdminProvider>
          <EmployeeProvider>
            <AuthInitializer>
              <React.Suspense fallback={
                <div
                  className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA]"
                  style={{ minHeight: '100dvh' }}
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1C205C] mb-4"></div>
                  <p className="text-[#1C205C] font-medium">Loading...</p>
                </div>
              }>
                <RouterProvider router={router} />
              </React.Suspense>
            </AuthInitializer>
            <Toaster />
          </EmployeeProvider>
        </AdminProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;

