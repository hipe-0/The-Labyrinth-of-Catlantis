// src/components/Building.js
//
// A building is a fully sealed 1x1 maze cell rendered as a solid white block.
// Its body fills the cell plus the 0.12 wall volume, so the sides land on the
// same plane as the neighbouring walls. A dark cap (flat slab or pyramid)
// makes it read as a building rather than a taller wall.
import React from 'react';
import * as THREE from 'three';

import { GAME_CONFIG } from '../config/gameConfig';

const UNIT_EDGES = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
const { WALL, BUILDINGS } = GAME_CONFIG;

// Two extra millimetres keep the body just proud of the hidden perimeter wall
// panels, avoiding coplanar faces without a visible step.
const BODY_SIZE = 1 + WALL.THICKNESS + 0.002;
const CAP_SIZE = BODY_SIZE + 0.06;
const CAP_HEIGHT = 0.1;
const PYRAMID_HEIGHT = 0.32;

export function Building({ building }) {
  const { x, z, height, roof } = building;
  const bodyHeight = Math.max(height, WALL.HEIGHT + 0.002);

  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, bodyHeight / 2, 0]}
        scale={[BODY_SIZE, bodyHeight, BODY_SIZE]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0} roughness={0.5} />
      </mesh>

      <lineSegments
        geometry={UNIT_EDGES}
        position={[0, bodyHeight / 2, 0]}
        scale={[BODY_SIZE, bodyHeight, BODY_SIZE]}
      >
        <lineBasicMaterial color="white" linewidth={2} />
      </lineSegments>

      {roof === 'pyramid' ? (
        <mesh
          position={[0, bodyHeight + PYRAMID_HEIGHT / 2, 0]}
          rotation={[0, Math.PI / 4, 0]}
          castShadow
          receiveShadow
        >
          <coneGeometry args={[CAP_SIZE / Math.SQRT2, PYRAMID_HEIGHT, 4]} />
          <meshStandardMaterial
            color={BUILDINGS.ROOF_COLOR}
            metalness={0}
            roughness={0.6}
          />
        </mesh>
      ) : (
        <mesh
          position={[0, bodyHeight + CAP_HEIGHT / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[CAP_SIZE, CAP_HEIGHT, CAP_SIZE]} />
          <meshStandardMaterial
            color={BUILDINGS.ROOF_COLOR}
            metalness={0}
            roughness={0.6}
          />
        </mesh>
      )}
    </group>
  );
}
