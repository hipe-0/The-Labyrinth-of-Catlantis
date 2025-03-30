// src/MazeScene.js
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { generateMaze } from './utils/mazeGeneration';
import { createMovementController } from './utils/movementController';
import { CuteCat } from './components/CuteCat';
import { StarField } from './components/StarField';
import { Moon } from './components/Moon';
import { Floor } from './components/Floor';
import { ExitBeacon } from './components/ExitBeacon';

export function MazeScene({ isGameStarted }) {
  const { camera } = useThree();
  
  const playerRef = useRef({
    x: 1,  // Start at center of first walkable tile
    y: 1,  // Start at center of first walkable tile
    rotation: -Math.PI / 2,  // Initial rotation (facing right)
    targetX: 1,
    targetY: 1,
    targetRotation: -Math.PI / 2,
    jumpVelocity: 0,
    jumpHeight: 0,
    isJumping: false,
    collectedCats: new Set()
  });
  
  const [mazeData, setMazeData] = useState(() => generateMaze());
  const { maze: generatedMaze, exitX, exitY, cats } = mazeData;
  const [collectedCats, setCollectedCats] = useState(new Set());
  const [skyColor, setSkyColor] = useState('#000000');

  const movementController = useMemo(() => {
    return createMovementController(
      generatedMaze, 
      playerRef, 
      setCollectedCats, 
      setSkyColor, 
      cats
    );
  }, [generatedMaze, cats]);

  const checkExit = useCallback(() => {
    const player = playerRef.current;
    const gridX = Math.round(player.x);
    const gridZ = Math.round(player.y);

    return gridX === exitX && 
           gridZ === exitY && 
           player.collectedCats.size === 6;
  }, [exitX, exitY]);

  useEffect(() => {
    if (isGameStarted) {
      // Set initial camera position and orientation
      camera.position.set(1, 0.5, 1);  // Match player starting position
      camera.rotation.set(0, -Math.PI / 2, 0);
      camera.updateProjectionMatrix();
    }

    // Add event listeners at document level
    document.addEventListener('keydown', movementController.handleKeyDown);
    document.addEventListener('keyup', movementController.handleKeyUp);

    return () => {
      document.removeEventListener('keydown', movementController.handleKeyDown);
      document.removeEventListener('keyup', movementController.handleKeyUp);
    };
  }, [camera, movementController, isGameStarted]);

  useFrame((state, delta) => {
    const player = playerRef.current;

    if (checkExit()) {
      const newMazeData = generateMaze();
      setMazeData(newMazeData);
      
      player.x = 1;
      player.y = 1;
      player.targetX = 1;
      player.targetY = 1;
      player.collectedCats = new Set();
      
      setCollectedCats(new Set());
      setSkyColor('#000000');
      
      return;
    }

    movementController.updatePlayerMovement(player, delta, cats, setCollectedCats, setSkyColor);
    
    // Update camera
    camera.position.x = player.x;
    camera.position.z = player.y;
    camera.position.y = 0.5 + player.jumpHeight;
    camera.rotation.set(0, player.rotation, 0);  // Only rotate around Y axis
  });

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Moonlight with soft shadows */}
      <pointLight 
        position={[30, 30, 30]} 
        intensity={0.5} 
        color="#AAAAFF" 
        castShadow 
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      <StarField />
      <Moon />
      <Floor />
      <ExitBeacon exitX={exitX} exitY={exitY} />

      {cats.map((cat, index) => !collectedCats.has(index) && (
        <group key={`cat-${index}`} position={[cat.x, 0, cat.y]}>
          <CuteCat color={cat.color} />
        </group>
      ))}

      {generatedMaze.map((row, z) => 
        row.map((cell, x) => {
          if (cell === 1) {
            const horizontalScaleX = Math.random() < 0.1 
              ? Math.random() * 0.3 + 0.85
              : 1;
            
            const verticalScale = Math.random() < 0.2 
              ? Math.random() * 2.5 + 0.5
              : 1;

            return (
              <group key={`${x}-${z}`} position={[x, verticalScale/2, z]}>
                <mesh 
                  scale={[horizontalScaleX, verticalScale, 1]} 
                  castShadow 
                  receiveShadow
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial 
                    color="black" 
                    emissive="#333333" 
                    emissiveIntensity={0.3} 
                  />
                </mesh>
                <lineSegments scale={[horizontalScaleX, verticalScale, 1]}>
                  <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
                  <lineBasicMaterial color="white" linewidth={2} />
                </lineSegments>
              </group>
            );
          }
          return null;
        })
      )}
    </>
  );
}
