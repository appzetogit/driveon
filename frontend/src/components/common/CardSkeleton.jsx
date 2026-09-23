import Skeleton from './Skeleton';

/**
 * CardSkeleton Component
 * Skeleton loader for card components
 * Mobile-optimized
 */
const CardSkeleton = () => {
  return (
    <div className="bg-background-primary border border-border-default rounded-lg p-4 md:p-6">
      <div className="space-y-4">
        {/* Image skeleton */}
        <Skeleton variant="rectangular" height="200px" className="w-full" />
        
        {/* Title skeleton */}
        <Skeleton variant="text" width="60%" height="24px" />
        
        {/* Description skeleton */}
        <Skeleton variant="text" lines={3} />
        
        {/* Button skeleton */}
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width="100px" height="44px" />
          <Skeleton variant="rectangular" width="100px" height="44px" />
        </div>
      </div>
    </div>
  );
};

export default CardSkeleton;

