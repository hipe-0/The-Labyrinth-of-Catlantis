// src/App.js
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { MazeScene } from './MazeScene';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden' }}>
      <Canvas 
        style={{background:'black'}}
        camera={{ 
          fov: 75, 
          near: 0.1, 
          far: 1000,
          position: [1, 0.5, 1]
        }}
        gl={{ antialias: true }}
      >
        <MazeScene />
      </Canvas>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        zIndex: 10
      }}>
        Use Arrow Keys to Navigate | Space to Jump
      </div>
    </div>
  );
}
 
export default App;
