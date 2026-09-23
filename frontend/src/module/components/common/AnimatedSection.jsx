import { motion } from 'framer-motion';
import useInViewAnimation from '../../hooks/useInViewAnimation';

/**
 * AnimatedSection Component
 * Reusable wrapper component that adds scroll-based animations
 * 
 * @param {React.ReactNode} children - Content to animate
 * @param {Object} animationProps - Framer Motion animation props
 * @param {Object} animationProps.initial - Initial animation state
 * @param {Object} animationProps.animate - Animated state (will be controlled by scroll)
 * @param {Object} animationProps.transition - Transition configuration
 * @param {string} className - Additional CSS classes
 * @param {Object} style - Additional inline styles
 * @param {number} threshold - IntersectionObserver threshold (0-1)
 * @param {string} rootMargin - IntersectionObserver root margin
 * @param {boolean} triggerOnce - If true, animation only runs once
 * @param {Object} rest - Other props to pass to motion.div
 */
const AnimatedSection = ({
  children,
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.5 },
  className = '',
  style = {},
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = false,
  ...rest
}) => {
  const [ref, isInView] = useInViewAnimation({
    threshold,
    rootMargin,
    triggerOnce,
  });

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? animate : initial}
      transition={transition}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;

