// src/utils/mazeGeneration.js
import { GAME_CONFIG } from '../config/gameConfig';

export const createEmptyMaze = (width, height) => {
  return Array(height).fill().map(() => Array(width).fill(1));
};

export const isValidMazeCoordinate = (maze, x, y) => {
  return x >= 0 && x < maze[0].length && y >= 0 && y < maze.length;
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

const createRooms = (maze, numRooms) => {
  const mazeWidth = maze[0].length;
  const mazeHeight = maze.length;

  for (let roomIndex = 0; roomIndex < numRooms; roomIndex++) {
    const roomWidth = Math.floor(Math.random() * 3) + 2;
    const roomHeight = Math.floor(Math.random() * 3) + 2;
    
    const startX = Math.floor(Math.random() * (mazeWidth - roomWidth - 2)) + 1;
    const startY = Math.floor(Math.random() * (mazeHeight - roomHeight - 2)) + 1;
    
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

export const placeCats = (maze) => {
  const cats = [];
  const catColors = ['white', 'black', 'gray', 'mix'];
  const maxAttempts = maze[0].length * maze.length;
  let attempts = 0;

  while (cats.length < 6 && attempts < maxAttempts) {
    const x = Math.floor(Math.random() * maze[0].length);
    const y = Math.floor(Math.random() * maze.length);
    
    if (maze[y][x] === 0 && !cats.some(cat => cat.x === x && cat.y === y)) {
      cats.push({ 
        x, 
        y,
        color: catColors[Math.floor(Math.random() * catColors.length)]
      });
    }
    
    attempts++;
  }
  
  return cats;
};

export const generateMaze = () => {
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
