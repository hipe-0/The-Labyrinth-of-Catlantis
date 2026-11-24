// src/components/HorizonMountains.js
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig';
import { generateFractalRing } from '../utils/fractal';
import { getMountainHeights } from '../utils/mountainHeight';

const { HORIZON, MAZE_WIDTH } = GAME_CONFIG;
const MAZE_CENTER = (MAZE_WIDTH - 1) / 2;

const createRingGeometry = (ring) => {
  const points = generateFractalRing({
    radius: ring.RADIUS,
    seed: ring.SEED,
    initialPoints: HORIZON.INITIAL_POINTS,
    initialJitter: HORIZON.INITIAL_JITTER,
    passes: HORIZON.PASSES,
    amplitude: HORIZON.AMPLITUDE,
    roughness: HORIZON.ROUGHNESS,
  });

  const heights = getMountainHeights(points, {
    seed: ring.SEED,
    frequency: HORIZON.RIDGE_FREQUENCY,
    baseHeight: ring.HEIGHT,
    span: ring.SPAN,
  });

  const wallPositions = [];
  const bandPositions = [];
  const indices = [];

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

  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;

    if (heights[index] <= 0 && heights[next] <= 0) {
      continue;
    }

    const bottom = index * 2;
    const top = bottom + 1;
    const nextBottom = next * 2;
    const nextTop = nextBottom + 1;

    indices.push(bottom, nextBottom, nextTop, bottom, nextTop, top);
  }

  const wallGeometry = new THREE.BufferGeometry();
  wallGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(wallPositions, 3)
  );
  wallGeometry.setIndex(indices);
  wallGeometry.computeVertexNormals();

  const topBandGeometry = new THREE.BufferGeometry();
  topBandGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(bandPositions, 3)
  );
  topBandGeometry.setIndex(indices.slice());

  return { ring, wallGeometry, topBandGeometry };
};

export function HorizonMountains() {
  const rings = useMemo(
    () => HORIZON.RINGS.map((ring) => createRingGeometry(ring)),
    []
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
