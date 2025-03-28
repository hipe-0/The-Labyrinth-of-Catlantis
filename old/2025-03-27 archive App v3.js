import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Color Configuration
const CAT_COLORS = {
  'white': { body: '#FFFFFF', ears: '#F0F0F0', eyes: '#000000' },
  'black': { body: '#333333', ears: '#1A1A1A', eyes: '#FFFFFF' },
  'gray': { body: '#808080', ears: '#696969', eyes: '#FFFFFF' },
  'mix': { body: '#A0522D', ears: '#8B4513', eyes: '#000000' }
};

const GAME_CONFIG = {
  MAZE_WIDTH: 31,
  MAZE_HEIGHT: 31,
  MOVE_SPEED: 0.1,
  ROTATE_SPEED: 0.3,
  RECENTER_SPEED: 0.1,
  RECENTER_THRESHOLD: 0.2,
  JUMP_VELOCITY: 4, // Increased from 2 to 4
  GRAVITY: 9.8
};

// Maze Generation Utilities
const createEmptyMaze = (width, height) => {
  return Array(height).fill().map(() => Array(width).fill(1));
};

const carvePassages = (maze, x, y) => {
  maze[y][x] = 0;
  
  const directions = [
    [0, 2], [0, -2], [2, 0], [-2, 0]
  ].sort(() => Math.random() - 0.5);
  
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    
    if (isValidMazeCoordinate(maze, nx, ny) && maze[ny][nx] === 1) {
      maze[y + dy/2][x + dx/2] = 0;
      carvePassages(maze, nx, ny);
    }
  }
};

const isValidMazeCoordinate = (maze, x, y) => {
  return x >= 0 && x < maze[0].length && y >= 0 && y < maze.length;
};

const createRooms = (maze, numRooms) => {
  const width = maze[0].length;
  const height = maze.length;

  for (let i = 0; i < numRooms; i++) {
    const roomWidth = Math.floor(Math.random() * 3) + 2;
    const roomHeight = Math.floor(Math.random() * 3) + 2;
    
    const startX = Math.floor(Math.random() * (width - roomWidth - 2)) + 1;
    const startY = Math.floor(Math.random() * (height - roomHeight - 2)) + 1;
    
    clearRoomArea(maze, startX, startY, roomWidth, roomHeight);
  }
};

const clearRoomArea = (maze, startX, startY, roomWidth, roomHeight) => {
  const width = maze[0].length;
  const height = maze.length;

  for (let y = startY; y < startY + roomHeight; y++) {
    for (let x = startX; x < startX + roomWidth; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        maze[y][x] = 0;
      }
    }
  }
};

const placeCats = (maze) => {
  const cats = [];
  const width = maze[0].length;
  const height = maze.length;

  for (let i = 0; i < 6; i++) {
    const { x, y } = findEmptyCatSpot(maze, cats);
    
    cats.push({ 
      x, 
      y,
      color: ['white', 'black', 'gray', 'mix'][Math.floor(Math.random() * 4)]
    });
  }
  
  return cats;
};

const findEmptyCatSpot = (maze, existingCats) => {
  const width = maze[0].length;
  const height = maze.length;
  let x, y;

  do {
    x = Math.floor(Math.random() * width);
    y = Math.floor(Math.random() * height);
  } while (
    maze[y][x] !== 0 || 
    existingCats.some(cat => cat.x === x && cat.y === y)
  );
  
  return { x, y };
};

const generateMaze = () => {
  const { MAZE_WIDTH, MAZE_HEIGHT } = GAME_CONFIG;
  const maze = createEmptyMaze(MAZE_WIDTH, MAZE_HEIGHT);
  
  carvePassages(maze, 1, 1);
  maze[1][1] = 0;
  
  const exitX = MAZE_WIDTH - 2;
  const exitY = MAZE_HEIGHT - 2;
  maze[exitY][exitX] = 2; // Exit marker
  
  createRooms(maze, Math.floor(Math.random() * 3) + 3);
  const cats = placeCats(maze);
  
  return { maze, exitX, exitY, cats };
};

// Movement and Collision Utilities
const createMovementController = (
  maze, 
  playerRef, 
  setCollectedCats, 
  setSkyColor, 
  cats
) => {
  const { MOVE_SPEED, ROTATE_SPEED, RECENTER_SPEED, RECENTER_THRESHOLD } = GAME_CONFIG;

  const checkCollision = (x, z) => {
    const gridX = Math.round(x);
    const gridZ = Math.round(z);

    return maze[Math.round(gridZ)] && 
           maze[Math.round(gridZ)][Math.round(gridX)] !== 1;
  };

  const handleKeyDown = (event) => {
    const player = playerRef.current;
    const moveAmount = 1;
    
    switch(event.key) {
      case 'ArrowUp':
        {
          const newX = player.x - moveAmount * Math.sin(player.rotation);
          const newZ = player.y - moveAmount * Math.cos(player.rotation);
          
          if (checkCollision(newX, newZ)) {
            player.targetX = newX;
            player.targetY = newZ;

            const catIndex = cats.findIndex(cat => 
              Math.round(cat.x) === Math.round(newX) && 
              Math.round(cat.y) === Math.round(newZ)
            );
            
            if (catIndex !== -1) {
              const newCollectedCats = new Set(playerRef.current.collectedCats);
              if (!newCollectedCats.has(catIndex)) {
                newCollectedCats.add(catIndex);
                playerRef.current.collectedCats = newCollectedCats;
                setCollectedCats(newCollectedCats);

                const lightenPercentage = (newCollectedCats.size / 6) * 40;
                const newSkyColor = `hsl(240, ${100 - lightenPercentage}%, ${50 + lightenPercentage/2}%)`;
                setSkyColor(newSkyColor);
              }
            }
          }
        }
        break;
      case 'ArrowDown':
        {
          const newX = player.x + moveAmount * Math.sin(player.rotation);
          const newZ = player.y + moveAmount * Math.cos(player.rotation);
          
          if (checkCollision(newX, newZ)) {
            player.targetX = newX;
            player.targetY = newZ;
          }
        }
        break;
      case 'ArrowLeft':
        player.targetRotation = player.rotation + Math.PI / 4;
        break;
      case 'ArrowRight':
        player.targetRotation = player.rotation - Math.PI / 4;
        break;
      case ' ':
        if (!player.isJumping) {
          player.isJumping = true;
          player.jumpVelocity = GAME_CONFIG.JUMP_VELOCITY;
          player.jumpHeight = 0;
        }
        break;
    }
  };

  const updatePlayerMovement = (player, delta) => {
    // Jump physics with gravity
    if (player.isJumping) {
      player.jumpVelocity -= GAME_CONFIG.GRAVITY * delta;
      player.jumpHeight += player.jumpVelocity * delta;

      if (player.jumpHeight <= 0) {
        player.jumpHeight = 0;
        player.jumpVelocity = 0;
        player.isJumping = false;
      }
    }

    // Smooth position interpolation
    player.x += (player.targetX - player.x) * MOVE_SPEED;
    player.y += (player.targetY - player.y) * MOVE_SPEED;

    // Smooth rotation interpolation
    player.rotation += (player.targetRotation - player.rotation) * ROTATE_SPEED;

    // Recentering logic
    const blockCenterX = Math.round(player.x);
    const blockCenterZ = Math.round(player.y);
    
    const distanceFromCenterX = Math.abs(player.x - blockCenterX);
    const distanceFromCenterZ = Math.abs(player.y - blockCenterZ);

    if (distanceFromCenterX > RECENTER_THRESHOLD || distanceFromCenterZ > RECENTER_THRESHOLD) {
      player.x += (blockCenterX - player.x) * RECENTER_SPEED;
      player.y += (blockCenterZ - player.y) * RECENTER_SPEED;
    }
  };

  return { handleKeyDown, updatePlayerMovement };
};
// Rendering Components
function CuteCat({ color = 'white' }) {
  const currentColors = CAT_COLORS[color];

  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.6]} />
        <meshStandardMaterial color={currentColors.body} />
      </mesh>
      
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color={currentColors.body} />
      </mesh>
      
      <mesh position={[-0.1, 0.65, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.1, 0.2, 32]} />
        <meshStandardMaterial color={currentColors.ears} />
      </mesh>
      <mesh position={[0.1, 0.65, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.1, 0.2, 32]} />
        <meshStandardMaterial color={currentColors.ears} />
      </mesh>
      
      <mesh position={[-0.1, 0.45, 0.2]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={currentColors.eyes} />
      </mesh>
      <mesh position={[0.1, 0.45, 0.2]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={currentColors.eyes} />
      </mesh>
    </group>
  );
}

function StarField() {
  const starsRef = useRef();
  const starCount = 1000;

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.05;
    }
  });

  const stars = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 50;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return geometry;
  }, []);

  return (
    <points ref={starsRef} geometry={stars}>
      <pointsMaterial color="white" size={0.1} sizeAttenuation />
    </points>
  );
}

function Moon() {
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
        emissiveIntensity={1} // Increased from 0.5 to 1
      />
    </mesh>
  );
}

function ExitBeacon({ exitX, exitY }) {
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

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#555555" />
    </mesh>
  );
}

function MazeScene() {
  const { camera } = useThree();
  const { MAZE_WIDTH, MAZE_HEIGHT } = GAME_CONFIG;
  
  const playerRef = useRef({
    x: 1, 
    y: 1, 
    rotation: 0,
    targetX: 1,
    targetY: 1,
    targetRotation: 0,
    jumpVelocity: 0,
    jumpHeight: 0,
    isJumping: false,
    collectedCats: new Set()
  });
  
  const [mazeData, setMazeData] = useState(() => generateMaze());
  const { maze: generatedMaze, exitX, exitY, cats } = mazeData;
  const [collectedCats, setCollectedCats] = useState(new Set());
  const [skyColor, setSkyColor] = useState('#000000');

  const checkExit = () => {
    const player = playerRef.current;
    const gridX = Math.round(player.x);
    const gridZ = Math.round(player.y);

    return gridX === exitX && gridZ === exitY && player.collectedCats.size === 6;
  };

  const { handleKeyDown, updatePlayerMovement } = createMovementController(
    generatedMaze, 
    playerRef, 
    setCollectedCats, 
    setSkyColor, 
    cats
  );

  useEffect(() => {
    camera.position.set(1, 0.5, 1);
    camera.lookAt(2, 0.5, 1);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [camera, generatedMaze, cats]);

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

    updatePlayerMovement(player, delta);

    camera.position.x = player.x + 0.2 * Math.sin(player.rotation);
    camera.position.z = player.y + 0.2 * Math.cos(player.rotation);
    camera.position.y = 0.5 + player.jumpHeight;
    camera.rotation.y = player.rotation;
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