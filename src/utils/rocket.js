// src/utils/rocket.js
//
// Pure motion curve for a collected cat's trip into the sky.

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export const getCatRocketPose = ({
  elapsed,
  delay = 0,
  duration,
  height,
  spinSpeed,
  endScale,
}) => {
  const activeTime = Math.max(0, elapsed - delay);
  const activeDuration = Math.max(duration - delay, 0.0001);
  const progress = clamp(activeTime / activeDuration, 0, 1);
  // t^2 starts gently and accelerates, which reads as a rocket launch.
  const eased = progress * progress;

  return {
    progress,
    y: height * eased,
    scale: 1 + (endScale - 1) * eased,
    spin: progress > 0 ? spinSpeed * activeTime : 0,
  };
};
