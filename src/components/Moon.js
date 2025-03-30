// src/components/Moon.js
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { GAME_CONFIG } from '../config/gameConfig';

export function Moon() {
  const moonRef = useRef();
  const orbitRef = useRef();
  const { 
    ORBIT_SPEED, 
    SPIN_SPEED, 
    POSITION, 
    SIZE, 
    INNER_SIZE, 
    SEGMENTS,
    OUTER_COLOR,
    INNER_COLOR,
    OUTER_EMISSIVE,
    INNER_EMISSIVE
  } = GAME_CONFIG.MOON;
  const { TILT_ANGLE } = GAME_CONFIG.SKY;

  useFrame((state, delta) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.x = TILT_ANGLE;
      orbitRef.current.rotation.y += ORBIT_SPEED * delta;
    }
    if (moonRef.current) {
      moonRef.current.rotation.y += SPIN_SPEED * delta;
    }
  });

  return (
    <group ref={orbitRef} position={[0, 0, 0]}>
      <group ref={moonRef} position={POSITION}>
        <mesh>
          <sphereGeometry args={[SIZE, SEGMENTS, SEGMENTS]} />
          <meshStandardMaterial 
            color={OUTER_COLOR}
            emissive={OUTER_COLOR}
            emissiveIntensity={OUTER_EMISSIVE}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[INNER_SIZE, SEGMENTS, SEGMENTS]} />
          <meshStandardMaterial 
            color={INNER_COLOR}
            emissive={INNER_COLOR}
            emissiveIntensity={INNER_EMISSIVE}
          />
        </mesh>
      </group>
    </group>
  );
}
