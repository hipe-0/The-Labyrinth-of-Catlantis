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
  // Coarse pointers get the twin sticks immediately. Hybrid devices fall back
  // to the first real touch, which the handlers below still detect.
  const [hasTouch, setHasTouch] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }

    return window.matchMedia('(pointer: coarse)').matches;
  });
  const [showLevelScreen, setShowLevelScreen] = useState(false);
  const [completedLevel, setCompletedLevel] = useState(1);
  const [levelStartRequest, setLevelStartRequest] = useState(0);

  // Touch input is intentionally kept in refs, not React state. This avoids
  // re-rendering the 3D scene every time a stick is moved or released.
  const moveInputRef = useRef({ x: 0, y: 0 });
  const lookInputRef = useRef({ x: 0, y: 0 });
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
    // Drop any held sticks so the next level starts idle.
    moveInputRef.current = { x: 0, y: 0 };
    lookInputRef.current = { x: 0, y: 0 };
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

  const handleTouchMove = (input) => {
    setHasTouch(true);
    moveInputRef.current.x = input.x;
    moveInputRef.current.y = input.y;
  };

  const handleTouchLook = (input) => {
    setHasTouch(true);
    lookInputRef.current.x = input.x;
    lookInputRef.current.y = input.y;
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
              moveInputRef={moveInputRef}
              lookInputRef={lookInputRef}
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
            <TouchControls
              onMove={handleTouchMove}
              onLook={handleTouchLook}
              onJump={handleTouchJump}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
