// src/components/StarField.js
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig';

export function StarField() {
  const starsRef = useRef();
  const { STAR_COUNT, STAR_SIZE, STAR_RADIUS, ROTATION_SPEED, TILT_ANGLE } = GAME_CONFIG.SKY;

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.x = TILT_ANGLE;
      starsRef.current.rotation.y += delta * ROTATION_SPEED;
    }
  });

  const stars = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = STAR_RADIUS * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = STAR_RADIUS * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = STAR_RADIUS * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [STAR_COUNT, STAR_RADIUS]);

  return (
    <points ref={starsRef} geometry={stars}>
      <pointsMaterial color="white" size={STAR_SIZE} sizeAttenuation />
    </points>
  );
}
