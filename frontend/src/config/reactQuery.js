import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Configuration
 * Configured for optimal caching and data synchronization
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time: How long unused data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (useful for mobile)
      refetchOnWindowFocus: true,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
      
      // Show error notifications on mutation failure
      onError: (error) => {
        console.error('Mutation error:', error);
        // TODO: Add toast notification here
      },
    },
  },
});

