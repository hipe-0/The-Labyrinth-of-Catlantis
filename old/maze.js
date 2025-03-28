import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// Maze generation utility
const generateMaze = (width, height) => {
  const maze = Array(height).fill().map(() => Array(width).fill(1));
  
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
  
  // Ensure start and end points are open
  carve(1, 1);
  maze[1][1] = 0;
  maze[height - 2][width - 2] = 0;
  
  return maze;
};

const MazeGame = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerRef = useRef({ x: 1, y: 1, rotation: 0 });

  useEffect(() => {
    // Ensure Three.js is loaded
    if (!THREE) {
      console.error('Three.js not loaded');
      return;
    }

    // Generate maze
    const mazeWidth = 21;
    const mazeHeight = 21;
    const generatedMaze = generateMaze(mazeWidth, mazeHeight);

    // Set up scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(1, 0.5, 1);
    camera.lookAt(2, 0.5, 1);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Wall materials
    const wallMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      side: THREE.FrontSide 
    });
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      linewidth: 2 
    });

    // Create walls
    generatedMaze.forEach((row, z) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          // Solid wall
          const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(x, 0.5, z);
          scene.add(wall);

          // Wireframe edges
          const edges = new THREE.EdgesGeometry(wallGeometry);
          const wireframe = new THREE.LineSegments(edges, edgeMaterial);
          wireframe.position.set(x, 0.5, z);
          scene.add(wireframe);
        }
      });
    });

    // Player movement
    const movePlayer = (dx, dz, rotation = 0) => {
      const player = playerRef.current;
      const newX = player.x + dx;
      const newZ = player.y + dz;
      
      // Check if move is valid
      if (newX >= 0 && newX < mazeWidth && 
          newZ >= 0 && newZ < mazeHeight && 
          generatedMaze[Math.round(newZ)][Math.round(newX)] === 0) {
        
        player.x = newX;
        player.y = newZ;
        player.rotation += rotation;
        
        // Update camera position
        camera.position.x = player.x;
        camera.position.z = player.y;
        camera.rotation.y = player.rotation;
      }
    };

    // Keyboard controls
    const handleKeyDown = (event) => {
      const player = playerRef.current;
      switch(event.key) {
        case 'ArrowUp':
          movePlayer(
            Math.cos(player.rotation), 
            Math.sin(player.rotation)
          );
          break;
        case 'ArrowDown':
          movePlayer(
            -Math.cos(player.rotation), 
            -Math.sin(player.rotation)
          );
          break;
        case 'ArrowLeft':
          movePlayer(0, 0, -Math.PI / 4);
          break;
        case 'ArrowRight':
          movePlayer(0, 0, Math.PI / 4);
          break;
      }
    };

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      
      // Dispose of geometries and materials
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
    };
  }, []);

  return (
    <div className="maze-game-container">
      <canvas 
        ref={canvasRef} 
        className="maze-game-canvas"
      />
      <div className="maze-game-instructions">
        Use Arrow Keys to Navigate the Maze
      </div>
      <style jsx>{`
        .maze-game-container {
          width: 100vw;
          height: 100vh;
          margin: 0;
          overflow: hidden;
          position: relative;
        }
        .maze-game-canvas {
          width: 100%;
          height: 100%;
        }
        .maze-game-instructions {
          position: absolute;
          top: 10px;
          left: 10px;
          color: white;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default MazeGame;
