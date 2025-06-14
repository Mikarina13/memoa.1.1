/**
 * Animation duration constants (in milliseconds)
 */
export const ANIMATION_DURATION_VERY_SHORT = 300; // For quick transitions
export const ANIMATION_DURATION_SHORT = 1000; // 1 second animations
const ANIMATION_DURATION_MEDIUM = 1500; // 1.5 second animations
export const ANIMATION_DURATION_LONG = 2000; // 2 second animations
export const ANIMATION_DURATION_VERY_LONG = 2500; // 2.5 second animations
export const ANIMATION_DURATION_INTRO = 3000; // 3 second animations (intro)

/**
 * 3D model related constants
 */
export const MODEL_SCALE_DEFAULT = 1;
export const MODEL_SCALE_HOVER = 1.2;

/**
 * Camera position constants
 */
export const CAMERA_POSITION_INITIAL: [number, number, number] = [0, 2, 20];
export const CAMERA_POSITION_DEFAULT: [number, number, number] = [0, 1, 10];
export const CAMERA_POSITION_MEMENTO: [number, number, number] = [0, 1, 15];

/**
 * Camera field of view constants
 */
export const CAMERA_FOV_DEFAULT = 60;
export const CAMERA_FOV_WIDE = 75;

/**
 * Animation easing functions
 */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);