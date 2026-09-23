import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for scroll-based animations using IntersectionObserver
 * 
 * @param {Object} options - IntersectionObserver options
 * @param {number} options.threshold - Threshold for intersection (0-1)
 * @param {string} options.rootMargin - Root margin for intersection
 * @param {boolean} options.triggerOnce - If true, animation only runs once
 * @returns {[React.RefObject, boolean]} - [ref, isInView]
 * 
 * @example
 * const [ref, isInView] = useInViewAnimation({ threshold: 0.1 });
 * return <div ref={ref}>{isInView && 'Visible!'}</div>;
 */
const useInViewAnimation = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = false, // Set to false so animation runs every time it enters viewport
  } = options;

  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        if (isIntersecting) {
          setIsInView(true);
          if (!triggerOnce) {
            // Reset animation state when element enters viewport
            setHasAnimated(false);
          } else if (!hasAnimated) {
            setHasAnimated(true);
          }
        } else {
          // Reset when element leaves viewport (for re-animation on scroll back)
          if (!triggerOnce) {
            setIsInView(false);
            setHasAnimated(false);
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasAnimated]);

  return [ref, isInView];
};

export default useInViewAnimation;

