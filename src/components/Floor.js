// src/components/Floor.js
import React from 'react';
import { GAME_CONFIG } from '../config/gameConfig';

export function Floor() {
  const center = (GAME_CONFIG.MAZE_WIDTH - 1) / 2;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[center, -0.01, center]}
      receiveShadow
      castShadow
    >
      <planeGeometry args={[GAME_CONFIG.FLOOR_SIZE, GAME_CONFIG.FLOOR_SIZE]} />
      <meshStandardMaterial color="#2A2A2A" />
    </mesh>
  );
}
