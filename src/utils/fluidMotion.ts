import type { Transition, Variants } from 'motion/react';

/**
 * Laminar fluid-dynamics easing curve: smooth acceleration with viscous settling.
 */
export const FLUID_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Viscous surface-tension spring for container & droplet motion without bounce.
 */
export const FLUID_SPRING: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

/**
 * Cohesive droplet spring for sliding glass tab indicators.
 */
export const DROPLET_SPRING: Transition = {
  type: 'spring',
  stiffness: 390,
  damping: 34,
  mass: 0.85,
};

export const tabFlowVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : direction > 0 ? 28 : -28,
    scale: 0.988,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      x: FLUID_SPRING,
      scale: { duration: 0.28, ease: FLUID_EASE },
      opacity: { duration: 0.22, ease: FLUID_EASE },
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : direction > 0 ? -24 : 24,
    scale: 0.988,
    transition: {
      duration: 0.18,
      ease: FLUID_EASE,
    },
  }),
};

export const sheetBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: FLUID_EASE } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: FLUID_EASE } },
};

export const sheetPanelVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.975 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      y: FLUID_SPRING,
      scale: FLUID_SPRING,
      opacity: { duration: 0.2, ease: FLUID_EASE },
    },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.98,
    transition: { duration: 0.16, ease: FLUID_EASE },
  },
};
