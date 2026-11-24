// src/lab/mountainRing.jsx
//
// Lab-only mountain rings with a height-varying ridgeline. The game still uses
// the flat-topped HorizonMountains component until an option is approved.
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { GAME_CONFIG } from '../config/gameConfig';
import { generateFractalRing } from '../utils/fractal';

const { HORIZON, MAZE_WIDTH } = GAME_CONFIG;
const MAZE_CENTER = (MAZE_WIDTH - 1) / 2;
const TWO_PI = Math.PI * 2;

const seededRandom = (seed) => {
  let state = seed;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

// A cyclic sum of sines. Integer frequencies keep the ridge seamless around the
// ring; the phases are seeded so every option remains deterministic.
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

const normalizedHeights = (points, profile, baseHeight, span) => {
  const raw = points.map((point) => profile(point.angle));
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const range = Math.max(max - min, 1e-6);

  return raw.map((value) => {
    const normalized = (2 * (value - min)) / range - 1;
    const height = baseHeight + (span / 2) * normalized;

    // The mountain line is centered on the horizon, but it is never allowed to
    // go below the ground plane.
    return Math.max(0, height);
  });
};

const createRingGeometry = (ring, span, frequency) => {
  const points = generateFractalRing({
    radius: ring.RADIUS,
    seed: ring.SEED,
    initialPoints: HORIZON.INITIAL_POINTS,
    initialJitter: HORIZON.INITIAL_JITTER,
    passes: HORIZON.PASSES,
    amplitude: HORIZON.AMPLITUDE,
    roughness: HORIZON.ROUGHNESS,
  });

  const profile = buildProfile(ring.SEED, frequency);
  const heights = normalizedHeights(points, profile, ring.HEIGHT, span);

  const wallPositions = [];
  const wallIndices = [];
  const bandPositions = [];
  const bandIndices = [];

  points.forEach((point, index) => {
    wallPositions.push(point.x, 0, point.z);
    wallPositions.push(point.x, heights[index], point.z);

    const bandBottom = Math.max(
      0,
      heights[index] - HORIZON.TOP_BAND_HEIGHT
    );

    bandPositions.push(point.x, bandBottom, point.z);
    bandPositions.push(point.x, heights[index], point.z);
  });

  points.forEach((point, index) => {
    const next = (index + 1) % points.length;
    const bottom = index * 2;
    const top = bottom + 1;
    const nextBottom = next * 2;
    const nextTop = nextBottom + 1;

    if (heights[index] > 0 || heights[next] > 0) {
      wallIndices.push(
        bottom,
        nextBottom,
        nextTop,
        bottom,
        nextTop,
        top
      );
    }

    if (heights[index] > 0 || heights[next] > 0) {
      bandIndices.push(
        bottom,
        nextBottom,
        nextTop,
        bottom,
        nextTop,
        top
      );
    }
  });

  const wallGeometry = new THREE.BufferGeometry();
  wallGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(wallPositions, 3)
  );
  wallGeometry.setIndex(wallIndices);
  wallGeometry.computeVertexNormals();

  const topBandGeometry = new THREE.BufferGeometry();
  topBandGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(bandPositions, 3)
  );
  topBandGeometry.setIndex(bandIndices);

  return { ring, wallGeometry, topBandGeometry };
};

export function MountainRings({ spans, frequency }) {
  const rings = useMemo(
    () =>
      HORIZON.RINGS.map((ring, index) =>
        createRingGeometry(ring, spans[index], frequency)
      ),
    [spans, frequency]
  );

  useEffect(
    () => () => {
      rings.forEach(({ wallGeometry, topBandGeometry }) => {
        wallGeometry.dispose();
        topBandGeometry.dispose();
      });
    },
    [rings]
  );

  return (
    <group position={[MAZE_CENTER, 0, MAZE_CENTER]}>
      {rings.map(({ ring, wallGeometry, topBandGeometry }) => (
        <group key={ring.RADIUS}>
          <mesh geometry={wallGeometry}>
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={topBandGeometry}>
            <meshBasicMaterial
              color="#FFFFFF"
              side={THREE.DoubleSide}
              transparent
              opacity={ring.LINE_OPACITY}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
