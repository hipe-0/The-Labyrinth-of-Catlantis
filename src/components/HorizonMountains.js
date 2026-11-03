// src/components/HorizonMountains.js
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig';
import { generateFractalRing } from '../utils/fractal';

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

  const wallPositions = [];
  const wallIndices = [];

  points.forEach((point) => {
    wallPositions.push(point.x, 0, point.z);
    wallPositions.push(point.x, ring.HEIGHT, point.z);
  });

  points.forEach((point, index) => {
    const next = (index + 1) % points.length;
    const bottom = index * 2;
    const top = bottom + 1;
    const nextBottom = next * 2;
    const nextTop = nextBottom + 1;

    wallIndices.push(bottom, nextBottom, nextTop, bottom, nextTop, top);
  });

  const wallGeometry = new THREE.BufferGeometry();
  wallGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(wallPositions, 3)
  );
  wallGeometry.setIndex(wallIndices);
  wallGeometry.computeVertexNormals();

  const bandBottom = ring.HEIGHT - HORIZON.TOP_BAND_HEIGHT;
  const bandPositions = [];
  const bandIndices = [];

  points.forEach((point) => {
    bandPositions.push(point.x, bandBottom, point.z);
    bandPositions.push(point.x, ring.HEIGHT, point.z);
  });

  points.forEach((point, index) => {
    const next = (index + 1) % points.length;
    const bottom = index * 2;
    const top = bottom + 1;
    const nextBottom = next * 2;
    const nextTop = nextBottom + 1;

    bandIndices.push(bottom, nextBottom, nextTop, bottom, nextTop, top);
  });

  const topBandGeometry = new THREE.BufferGeometry();
  topBandGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(bandPositions, 3)
  );
  topBandGeometry.setIndex(bandIndices);

  return { ring, wallGeometry, topBandGeometry };
};

export function HorizonMountains() {
  const rings = useMemo(
    () => HORIZON.RINGS.map((ring) => createRingGeometry(ring)),
    []
  );

  useEffect(() => () => {
    rings.forEach(({ wallGeometry, topBandGeometry }) => {
      wallGeometry.dispose();
      topBandGeometry.dispose();
    });
  }, [rings]);

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
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
