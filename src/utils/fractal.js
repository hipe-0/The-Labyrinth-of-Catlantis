// src/utils/fractal.js

const TWO_PI = Math.PI * 2;

const seededRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

/**
 * Build a closed, rough ring by starting from a few control points and running
 * midpoint displacement around the circle. The first pass moves points by the
 * full amplitude; each later pass roughly halves the detail scale.
 *
 * Returns points in local X/Z space, centred on the origin.
 */
export const generateFractalRing = ({
  radius,
  seed,
  initialPoints = 10,
  initialJitter = 2.5,
  passes = 3,
  amplitude = 1.5,
  roughness = 0.55,
}) => {
  const random = seededRandom(seed);
  let points = [];

  for (let i = 0; i < initialPoints; i += 1) {
    points.push({
      angle: (i / initialPoints) * TWO_PI,
      radius: radius + (random() * 2 - 1) * initialJitter,
    });
  }

  let currentAmplitude = amplitude;

  for (let pass = 0; pass < passes; pass += 1) {
    const refined = [];

    for (let i = 0; i < points.length; i += 1) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      refined.push(p1);

      let nextAngle = p2.angle;
      if (nextAngle <= p1.angle) {
        nextAngle += TWO_PI;
      }

      refined.push({
        angle: (p1.angle + nextAngle) / 2,
        radius:
          (p1.radius + p2.radius) / 2 +
          (random() * 2 - 1) * currentAmplitude,
      });
    }

    points = refined;
    currentAmplitude *= roughness;
  }

  return points.map((point) => ({
    angle: point.angle,
    radius: point.radius,
    x: Math.cos(point.angle) * point.radius,
    z: Math.sin(point.angle) * point.radius,
  }));
};
