import { useRouteError, Link } from 'react-router-dom';

/**
 * RouteErrorBoundary Component
 * Handles errors in route components, especially lazy-loaded modules
 */
const RouteErrorBoundary = () => {
  const error = useRouteError();
  
  console.error('Route Error:', error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-2">
          {error?.message || 'An unexpected error occurred'}
        </p>
        
        {error?.stack && process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Error Details
            </summary>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="mt-6 space-x-4">
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;

