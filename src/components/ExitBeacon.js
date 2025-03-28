// src/components/ExitBeacon.js
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ExitBeacon({ exitX, exitY }) {
  const beamRef = useRef();
  const cubeRef = useRef();

  useFrame((state, delta) => {
    if (beamRef.current && cubeRef.current) {
      // Rotation centered on the top face of the cube
      beamRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
      beamRef.current.rotation.z = Math.cos(state.clock.elapsedTime) * 0.2;
      beamRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime) * 0.5;
    }
  });

  return (
    <group position={[exitX, 0.5, exitY]}>
      <mesh ref={cubeRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="darkgreen" />
      </mesh>
      
      <mesh ref={beamRef} position={[0, 1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 200, 32]} />
        <meshStandardMaterial 
          color="white" 
          transparent 
          opacity={0.7} 
          emissive="white" 
          emissiveIntensity={2} 
        />
      </mesh>
    </group>
  );
}
