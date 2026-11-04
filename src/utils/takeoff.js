// src/utils/takeoff.js
//
// Pure camera math for the level-complete fly-up. Keeping it separate makes the
// cinematic easy to test without mounting the 3D scene.

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export const smoothStep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export const shortestAngle = (from, to) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

export const getTakeoffPose = ({
  fromX,
  fromZ,
  fromYaw,
  elapsed,
  duration,
  mazeCenter,
  height,
  pitch,
  startHeight,
}) => {
  const progress = duration > 0 ? clamp(elapsed / duration, 0, 1) : 1;
  const eased = smoothStep(progress);
  const targetYaw = Math.atan2(
    -(mazeCenter - fromX),
    -(mazeCenter - fromZ)
  );
  const yawDelta = shortestAngle(fromYaw, targetYaw);

  return {
    progress,
    eased,
    x: fromX,
    z: fromZ,
    y: startHeight + height * eased,
    yaw: fromYaw + yawDelta * eased,
    pitch: pitch * eased,
    targetYaw,
  };
};
