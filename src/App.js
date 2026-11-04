// src/App.js
import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { StartScreen } from './components/StartScreen';
import { MazeScene } from './MazeScene';
import { TouchControls } from './components/TouchControls';
import { createAudioEngine } from './utils/audioEngine';
import { GAME_CONFIG } from './config/gameConfig';

const { LEVEL } = GAME_CONFIG;

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [hasTouch, setHasTouch] = useState(false);
  const [showLevelScreen, setShowLevelScreen] = useState(false);
  const [completedLevel, setCompletedLevel] = useState(1);
  const [levelStartRequest, setLevelStartRequest] = useState(0);

  // Touch input is intentionally kept in refs, not React state. This avoids
  // re-rendering the 3D scene every time a button is pressed or released.
  const touchDirectionRef = useRef(null);
  const jumpRequestRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => () => audioRef.current?.dispose(), []);

  const handleStart = () => {
    // Create/resume the audio context from this user gesture. Browsers block
    // Web Audio until a click or keypress, and the start screen is the only
    // guaranteed gesture before gameplay.
    if (!audioRef.current) {
      audioRef.current = createAudioEngine();
    }

    audioRef.current.start();
    setIsGameStarted(true);
  };

  const handleLevelComplete = (level) => {
    // Drop any held touch direction so the next level starts idle.
    touchDirectionRef.current = null;
    setCompletedLevel(level);
    setShowLevelScreen(true);
  };

  const handleNextLevel = () => {
    if (!audioRef.current) {
      audioRef.current = createAudioEngine();
    }

    audioRef.current.start();
    setShowLevelScreen(false);
    setLevelStartRequest((request) => request + 1);
  };

  const handleTouchMove = (direction) => {
    setHasTouch(true);
    touchDirectionRef.current = direction;
  };

  const handleTouchJump = () => {
    setHasTouch(true);
    jumpRequestRef.current += 1;
  };

  // Add touch detection on the entire app
  const handleTouchStart = () => {
    setHasTouch(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#000',
        touchAction: 'none', // Prevent default touch behaviors
        overscrollBehavior: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onTouchStart={handleTouchStart}
      onContextMenu={(event) => event.preventDefault()}
    >
      {!isGameStarted ? (
        <StartScreen onStart={handleStart} />
      ) : (
        <>
          {/* Shadows must be enabled before the first render, otherwise the
              materials compile without shadow support and never receive them.
              The map itself is refreshed by MazeScene at 5 Hz. */}
          <Canvas
            style={{
              background: 'black',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            camera={{
              fov: 75,
              near: 0.1,
              far: 1000,
              position: [1, 0.5, 1]
            }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            shadows={{ type: THREE.PCFSoftShadowMap, autoUpdate: false }}
          >
            <MazeScene
              isGameStarted={isGameStarted}
              touchDirectionRef={touchDirectionRef}
              jumpRequestRef={jumpRequestRef}
              audio={audioRef.current}
              levelStartRequest={levelStartRequest}
              onLevelComplete={handleLevelComplete}
            />
          </Canvas>
          {showLevelScreen && (
            <StartScreen
              onStart={handleNextLevel}
              title={LEVEL.COMPLETE_TITLE}
              subtitle={`Labyrinth ${completedLevel + 1} awaits`}
              buttonLabel={LEVEL.START_BUTTON}
              hint="Press Enter or Space to continue"
              controlsHint=""
            />
          )}
          {hasTouch && !showLevelScreen && (
            <TouchControls onMove={handleTouchMove} onJump={handleTouchJump} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
