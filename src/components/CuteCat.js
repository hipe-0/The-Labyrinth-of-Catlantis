// src/components/CuteCat.js
import React from 'react';
import { CAT_COLORS } from '../config/gameConfig';

export function CuteCat({ color = 'white' }) {
  const currentColors = CAT_COLORS[color];

  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.6]} />
        <meshStandardMaterial color={currentColors.body} />
      </mesh>
      
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color={currentColors.body} />
      </mesh>
      
      <mesh position={[-0.1, 0.65, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.1, 0.2, 32]} />
        <meshStandardMaterial color={currentColors.ears} />
      </mesh>
      <mesh position={[0.1, 0.65, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.1, 0.2, 32]} />
        <meshStandardMaterial color={currentColors.ears} />
      </mesh>
      
      <mesh position={[-0.1, 0.45, 0.2]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={currentColors.eyes} />
      </mesh>
      <mesh position={[0.1, 0.45, 0.2]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={currentColors.eyes} />
      </mesh>
    </group>
  );
}
