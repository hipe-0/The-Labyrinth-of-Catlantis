// src/components/Floor.js
import React from 'react';
import * as THREE from 'three';

export function Floor() {
  return (
    <group position={[0, 0, 0]}>
      {/* Main floor plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#000000"
          metalness={0}
          roughness={0.5}
        />
      </mesh>
      
      {/* Grid lines using lines */}
      <lineSegments position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes.position"
            count={400}
            array={new Float32Array(createGridLines())}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FFFFFF" />
      </lineSegments>
    </group>
  );
}

function createGridLines() {
  const size = 100;
  const divisions = 100;
  const step = size / divisions;
  const vertices = [];
  
  // Create horizontal lines
  for (let i = -size/2; i <= size/2; i += step) {
    vertices.push(-size/2, 0, i, size/2, 0, i);
  }
  
  // Create vertical lines
  for (let i = -size/2; i <= size/2; i += step) {
    vertices.push(i, 0, -size/2, i, 0, size/2);
  }
  
  return vertices;
}
