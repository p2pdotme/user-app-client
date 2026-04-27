import { AnimatePresence, motion } from "motion/react";
import { useLocation } from "react-router";

interface PageTransitionerProps {
  children: React.ReactNode;
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
}

/**
 * PageTransitioner component
 *
 * This component provides a page transition effect when navigating between routes.
 * It uses the AnimatePresence component from motion/react to handle the transition.
 *
 * TODO: Implement a more sophisticated page transition with navigation direction,
 * platform specific animations, and more.
 *
 * @param {React.ReactNode} children - The child elements to be transitioned.
 * @param {string} className - Additional CSS classes for the container.
 * @returns {React.ReactNode} The transitioned child elements.
 **/
export function PageTransitioner({
  children,
  className,
}: PageTransitionerProps) {
  const location = useLocation();

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.key}
          initial={{ opacity: 0.75, y: 1, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0.75, y: 1, scale: 0.99 }}
          transition={{ duration: 0.1 }}
          className={className}>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
