'use client';
import { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 28,
      mass: 0.9
    }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.2 }
  }
};

export const staggerChildren = (stagger = 0.06): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger
    }
  }
});
