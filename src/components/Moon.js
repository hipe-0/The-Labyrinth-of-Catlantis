// src/components/Moon.js
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Moon() {
  const moonRef = useRef();
  const orbitRef = useRef();
  const moonOrbitSpeed = 0.05; // Match star field rotation speed
  const moonSpinSpeed = 0.02; // Self-rotation speed

  useFrame((state, delta) => {
    if (orbitRef.current) {
      // Set 45-degree tilt
      orbitRef.current.rotation.x = Math.PI / 4;
      // Orbit around the scene
      orbitRef.current.rotation.y += moonOrbitSpeed * delta;
    }
    if (moonRef.current) {
      // Self-rotation
      moonRef.current.rotation.y += moonSpinSpeed * delta;
    }
  });

  return (
    <group ref={orbitRef} position={[0, 0, 0]}>
      <group ref={moonRef} position={[30, 30, 30]}>
        <mesh>
          <sphereGeometry args={[5, 32, 32]} />
          <meshStandardMaterial 
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[4.8, 32, 32]} />
          <meshStandardMaterial 
            color="#CCCCCC"
            emissive="#CCCCCC"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}
