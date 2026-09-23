import { Link } from 'react-router-dom';

/**
 * NotFoundPage Component
 * 404 Error Page - Mobile-optimized
 */
const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary px-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Page Not Found
        </h2>
        <p className="text-text-secondary mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity min-h-[44px] min-w-[44px]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

