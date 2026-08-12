// Mutable, render-free store for the live crash multiplier.
// useCrashGame writes it every animation frame; CrashGraph reads it in its own
// rAF loop and updates the DOM imperatively, so the 60fps multiplier never
// triggers React re-renders (which caused the plane/number to stutter).
export const crashStore = {
  multiplier: 1,
  phase: 'waiting',
};