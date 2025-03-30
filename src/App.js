// src/App.js
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { MazeScene } from './MazeScene';
import { StartScreen } from './components/StartScreen';

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false);

  const handleStart = () => {
    setIsGameStarted(true);
    window.focus(); // Focus window when game starts
  };

  return (
    <div 
      style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden' }}
      onClick={() => isGameStarted && window.focus()}
      tabIndex={-1}
    >
      <Canvas 
        style={{
          background: 'black'
        }}
        camera={{ 
          fov: 75, 
          near: 0.1, 
          far: 1000,
          position: [1, 0.5, 1]  // Match player starting position
        }}
        gl={{ antialias: true }}
      >
        <MazeScene isGameStarted={isGameStarted} />
      </Canvas>
      {!isGameStarted && <StartScreen onStart={handleStart} />}
    </div>
  );
}

export default App;
