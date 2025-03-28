import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';



// Enhanced maze generation utility with room creation and exit placement
const generateMaze = (width, height) => {
  const maze = Array(height).fill().map(() => Array(width).fill(1));
  const cats = [];
  let exitX, exitY;
  
  const carve = (x, y) => {
    maze[y][x] = 0;
    
    const directions = [
      [0, 2], [0, -2], [2, 0], [-2, 0]
    ].sort(() => Math.random() - 0.5);
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && maze[ny][nx] === 1) {
        maze[y + dy/2][x + dx/2] = 0;
        carve(nx, ny);
      }
    }
  };
  
  // Create random rooms
  const createRooms = (numRooms) => {
    for (let i = 0; i < numRooms; i++) {
      const roomWidth = Math.floor(Math.random() * 3) + 2; // 2-4 wide
      const roomHeight = Math.floor(Math.random() * 3) + 2; // 2-4 tall
      
      const startX = Math.floor(Math.random() * (width - roomWidth - 2)) + 1;
      const startY = Math.floor(Math.random() * (height - roomHeight - 2)) + 1;
      
      // Clear the room area
      for (let y = startY; y < startY + roomHeight; y++) {
        for (let x = startX; x < startX + roomWidth; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            maze[y][x] = 0;
          }
        }
      }
    }
  };
  
  carve(1, 1);
  maze[1][1] = 0;
  
  // Place exit near bottom right
  exitX = width - 2;
  exitY = height - 2;
  maze[exitY][exitX] = 2; // Special exit marker
  
  // Add 3-5 random rooms
  createRooms(Math.floor(Math.random() * 3) + 3);
  
  // Place 6 cats randomly in open spaces
  for (let i = 0; i < 6; i++) {
    let catX, catY;
    do {
      catX = Math.floor(Math.random() * width);
      catY = Math.floor(Math.random() * height);
    } while (maze[catY][catX] !== 0 || 
             cats.some(cat => cat.x === catX && cat.y === catY));
    
    cats.push({ 
      x: catX, 
      y: catY,
      color: ['white', 'black', 'gray', 'mix'][Math.floor(Math.random() * 4)]
    });
  }
  
  return { maze, exitX, exitY, cats };
};

// (Previous generateMaze function remains the same)

function CuteCat({ color = 'white' }) {
  const catColors = {
    'white': { body: '#FFFFFF', ears: '#F0F0F0', eyes: '#000000' },
    'black': { body: '#333333', ears: '#1A1A1A', eyes: '#FFFFFF' },
    'gray': { body: '#808080', ears: '#696969', eyes: '#FFFFFF' },
    'mix': { body: '#A0522D', ears: '#8B4513', eyes: '#000000' }
  };

  const currentColors = catColors[color];

  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.6]} />
        <meshStandardMaterial color={currentColors.body} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color={currentColors.body} />
      </mesh>
      
      {/* Ears */}
      <mesh position={[-0.1, 0.65, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.1, 0.2, 32]} />
        <meshStandardMaterial color={currentColors.ears} />
      </mesh>
      <mesh position={[0.1, 0.65, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.1, 0.2, 32]} />
        <meshStandardMaterial color={currentColors.ears} />
      </mesh>
      
      {/* Eyes */}
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
      // Rotate around Y-axis to simulate planet rotation
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
      // Rotate with stars
      moonRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={moonRef} position={[30, 30, 0]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshStandardMaterial 
        color="#F0F0F0" 
        emissive="#F0F0F0" 
        emissiveIntensity={0.5} 
      />
    </mesh>
  );
}

function ExitBeacon({ exitX, exitY }) {
  const beamRef = useRef();

  useFrame((state, delta) => {
    if (beamRef.current) {
      // Random rotation and swaying
      beamRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
      beamRef.current.rotation.z = Math.cos(state.clock.elapsedTime) * 0.2;
      beamRef.current.position.y = 10 + Math.sin(state.clock.elapsedTime) * 0.5;
    }
  });

  return (
    <group position={[exitX, 0.5, exitY]}>
      {/* Exit block */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="darkgreen" />
      </mesh>
      
      {/* White exit beam - longer and more dynamic */}
      <mesh ref={beamRef} position={[0, 10, 0]}>
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
  const playerRef = useRef({
    x: 1, 
    y: 1, 
    rotation: 0,
    targetX: 1,
    targetY: 1,
    targetRotation: 0,
    jumpVelocity: 0,
    jumpHeight: 0
  });
  const mazeWidth = 31;
  const mazeHeight = 31;
  const [mazeData, setMazeData] = useState(() => generateMaze(mazeWidth, mazeHeight));
  const { maze: generatedMaze, exitX, exitY, cats } = mazeData;
  const [collectedCats, setCollectedCats] = useState(new Set());
  const [gameState, setGameState] = useState('playing');
  const [isJumping, setIsJumping] = useState(false);
  const [skyColor, setSkyColor] = useState('#000000');

  // Movement configuration
  const MOVE_SPEED = 0.1;
  const ROTATE_SPEED = 0.3;
  const RECENTER_SPEED = 0.1;
  const RECENTER_THRESHOLD = 0.2;

  // Check for wall collision
  const checkCollision = (x, z) => {
    const gridX = Math.round(x);
    const gridZ = Math.round(z);

    return generatedMaze[Math.round(gridZ)] && 
           generatedMaze[Math.round(gridZ)][Math.round(gridX)] !== 1;
  };

  // Check if player reached exit
  const checkExit = () => {
    const gridX = Math.round(playerRef.current.x);
    const gridZ = Math.round(playerRef.current.y);

    return gridX === exitX && gridZ === exitY && collectedCats.size === 6;
  };

  useEffect(() => {
    camera.position.set(1, 0.5, 1);
    camera.lookAt(2, 0.5, 1);

    const handleKeyDown = (event) => {
      if (gameState !== 'playing') return;

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
              if (catIndex !== -1 && !collectedCats.has(catIndex)) {
                const newCollectedCats = new Set(collectedCats);
                newCollectedCats.add(catIndex);
                setCollectedCats(newCollectedCats);

                // Gradually lighten sky
                const lightenPercentage = (newCollectedCats.size / 6) * 100;
                const newSkyColor = `hsl(240, ${100 - lightenPercentage}%, ${50 - lightenPercentage/3}%)`;
                setSkyColor(newSkyColor);
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
          if (!isJumping) {
            setIsJumping(true);
            player.jumpVelocity = 2; // Increased jump velocity
            player.jumpHeight = 0;
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [camera, generatedMaze, cats, collectedCats, gameState]);

  useFrame((state, delta) => {
    if (gameState !== 'playing') return;

    const player = playerRef.current;

    // Exit check with new game generation
    if (checkExit()) {
      // Regenerate maze and reset game state
      setMazeData(generateMaze(mazeWidth, mazeHeight));
      setCollectedCats(new Set());
      setSkyColor('#000000');
      player.x = 1;
      player.y = 1;
      player.targetX = 1;
      player.targetY = 1;
      return;
    }

    // Jump physics with gravity
    if (isJumping) {
      player.jumpVelocity -= 9.8 * delta;
      player.jumpHeight += player.jumpVelocity * delta;

      if (player.jumpHeight <= 0) {
        player.jumpHeight = 0;
        player.jumpVelocity = 0;
        setIsJumping(false);
      }

      camera.position.y = 0.5 + player.jumpHeight;
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

    // Update camera position and rotation
    camera.position.x = player.x + 0.2 * Math.sin(player.rotation);
    camera.position.z = player.y + 0.2 * Math.cos(player.rotation);
    camera.rotation.y = player.rotation;
  });

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <StarField />
      <Moon />
      <Floor />
      <ExitBeacon exitX={exitX} exitY={exitY} />

      {/* Cats */}
      {cats.map((cat, index) => !collectedCats.has(index) && (
        <group key={`cat-${index}`} position={[cat.x, 0, cat.y]}>
          <CuteCat color={cat.color} />
        </group>
      ))}

      {/* Maze walls */}
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
                <mesh scale={[horizontalScaleX, verticalScale, 1]}>
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