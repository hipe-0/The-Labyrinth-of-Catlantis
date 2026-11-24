// src/utils/mountainHeight.js
//
// Pure ridgeline height profile for the horizon rings. The profile is cyclic,
// centered on the ring's base height, and clamped to the ground at y = 0.

const TWO_PI = Math.PI * 2;

const seededRandom = (seed) => {
  let state = seed;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const buildProfile = (seed, frequency) => {
  const random = seededRandom(seed);
  const waves = [
    { frequency, amplitude: 1, phase: random() * TWO_PI },
    { frequency: frequency * 2 + 1, amplitude: 0.55, phase: random() * TWO_PI },
    { frequency: frequency * 4 + 3, amplitude: 0.28, phase: random() * TWO_PI },
  ];
  const totalAmplitude = waves.reduce(
    (total, wave) => total + wave.amplitude,
    0
  );

  return (angle) => {
    let value = 0;

    for (const wave of waves) {
      value +=
        Math.sin(angle * wave.frequency + wave.phase) * wave.amplitude;
    }

    return value / totalAmplitude;
  };
};

export const getMountainHeights = (
  points,
  { seed, frequency, baseHeight, span }
) => {
  const profile = buildProfile(seed, frequency);
  const raw = points.map((point) => profile(point.angle));
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const range = Math.max(max - min, 1e-6);

  return raw.map((value) => {
    const normalized = (2 * (value - min)) / range - 1;
    const height = baseHeight + (span / 2) * normalized;

    return Math.max(0, height);
  });
};
