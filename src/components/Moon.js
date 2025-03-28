// src/components/Moon.js
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function Moon() {
  const moonRef = useRef();

  useFrame((state, delta) => {
    if (moonRef.current) {
      // More pronounced circular motion
      const time = state.clock.elapsedTime * 0.2;
      moonRef.current.position.x = 30 * Math.cos(time);
      moonRef.current.position.y = 20 + 10 * Math.sin(time);
      moonRef.current.position.z = 30 * Math.sin(time);
      
      moonRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <mesh ref={moonRef} position={[30, 30, 0]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshStandardMaterial 
        color="#F0F0F0" 
        emissive="#F0F0F0" 
        emissiveIntensity={1} 
      />
    </mesh>
  );
}
