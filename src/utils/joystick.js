// src/utils/joystick.js
//
// Pure math shared by the on-screen sticks and the movement controller.
// Keeping this free of DOM access makes the dead-zone and clamping rules
// easy to test.

const EPSILON = 1e-8;

// Rescale a radial dead zone so the first pixel outside the zone produces a
// small movement instead of a sudden jump, and clamp the result to the unit
// circle. Directions are preserved.
export const applyRadialDeadZone = (x, y, deadZone = 0) => {
  const magnitude = Math.hypot(x, y);

  if (!Number.isFinite(magnitude) || magnitude <= EPSILON) {
    return { x: 0, y: 0, magnitude: 0 };
  }

  const clampedMagnitude = Math.min(magnitude, 1);
  const safeDeadZone = Math.min(Math.max(deadZone, 0), 0.99);

  if (clampedMagnitude <= safeDeadZone) {
    return { x: 0, y: 0, magnitude: 0 };
  }

  const scaledMagnitude =
    (clampedMagnitude - safeDeadZone) / (1 - safeDeadZone);
  const scale = scaledMagnitude / magnitude;

  return {
    x: x * scale,
    y: y * scale,
    magnitude: scaledMagnitude,
  };
};

// Convert a pointer position into stick coordinates. `offsetX`/`offsetY` are
// the clamped pixel offsets used to draw the knob; `x`/`y` are the normalized
// control values with +Y pointing away from the user (up on screen).
export const getStickVector = (
  clientX,
  clientY,
  centerX,
  centerY,
  radius
) => {
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const safeRadius = radius > EPSILON ? radius : 1;

  if (distance <= EPSILON) {
    return { offsetX: 0, offsetY: 0, x: 0, y: 0, magnitude: 0 };
  }

  const clampedDistance = Math.min(distance, safeRadius);
  const scale = distance > EPSILON ? clampedDistance / distance : 0;
  const offsetX = dx * scale;
  const offsetY = dy * scale;

  return {
    offsetX,
    offsetY,
    x: offsetX / safeRadius,
    y: -offsetY / safeRadius,
    magnitude: clampedDistance / safeRadius,
  };
};
