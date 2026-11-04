// src/utils/mazeGeneration.js
import { GAME_CONFIG } from '../config/gameConfig';

// Each cell stores which of its four edges are walls. Shared edges are removed
// from both cells when a passage is carved.
export const WALL_NORTH = 1;
export const WALL_EAST = 2;
export const WALL_SOUTH = 4;
export const WALL_WEST = 8;
export const ALL_WALLS = WALL_NORTH | WALL_EAST | WALL_SOUTH | WALL_WEST;

const DIRECTIONS = [
  { dx: 0, dz: -1, wall: WALL_NORTH, opposite: WALL_SOUTH },
  { dx: 1, dz: 0, wall: WALL_EAST, opposite: WALL_WEST },
  { dx: 0, dz: 1, wall: WALL_SOUTH, opposite: WALL_NORTH },
  { dx: -1, dz: 0, wall: WALL_WEST, opposite: WALL_EAST },
];

const createCell = () => ({ walls: ALL_WALLS });

export const createEmptyMaze = (width, height) => {
  return Array(height).fill().map(() =>
    Array(width).fill().map(() => createCell())
  );
};

export const isValidMazeCoordinate = (maze, x, y) => {
  return x >= 0 && x < maze[0].length && y >= 0 && y < maze.length;
};

export const hasWall = (cell, wall) => (cell.walls & wall) !== 0;

export const removeWall = (cell, wall) => {
  cell.walls &= ~wall;
};

const shuffle = (items) => {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

// Iterative recursive-backtracker on every cell. Every cell is visited, so the
// base maze is fully connected before rooms remove extra walls.
const carvePassages = (maze, startX, startY) => {
  const visited = new Set([`${startX},${startY}`]);
  const stack = [{ x: startX, z: startY }];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const directions = shuffle(DIRECTIONS);
    let advanced = false;

    for (const direction of directions) {
      const nextX = current.x + direction.dx;
      const nextZ = current.z + direction.dz;
      const key = `${nextX},${nextZ}`;

      if (
        isValidMazeCoordinate(maze, nextX, nextZ) &&
        !visited.has(key)
      ) {
        removeWall(maze[current.z][current.x], direction.wall);
        removeWall(maze[nextZ][nextX], direction.opposite);
        visited.add(key);
        stack.push({ x: nextX, z: nextZ });
        advanced = true;
        break;
      }
    }

    if (!advanced) {
      stack.pop();
    }
  }
};

const createRooms = (maze, numRooms) => {
  const mazeWidth = maze[0].length;
  const mazeHeight = maze.length;

  for (let roomIndex = 0; roomIndex < numRooms; roomIndex += 1) {
    const roomWidth = Math.floor(Math.random() * 3) + 2;
    const roomHeight = Math.floor(Math.random() * 3) + 2;
    const startX = Math.floor(Math.random() * (mazeWidth - roomWidth - 2)) + 1;
    const startY = Math.floor(Math.random() * (mazeHeight - roomHeight - 2)) + 1;

    openRoomArea(maze, startX, startY, roomWidth, roomHeight);
  }
};

const openRoomArea = (maze, startX, startY, roomWidth, roomHeight) => {
  for (let z = startY; z < startY + roomHeight; z += 1) {
    for (let x = startX; x < startX + roomWidth; x += 1) {
      if (x + 1 < startX + roomWidth) {
        const east = maze[z][x + 1];
        removeWall(maze[z][x], WALL_EAST);
        removeWall(east, WALL_WEST);
      }

      if (z + 1 < startY + roomHeight) {
        const south = maze[z + 1][x];
        removeWall(maze[z][x], WALL_SOUTH);
        removeWall(south, WALL_NORTH);
      }
    }
  }
};

export const getStartRotation = (maze) => {
  // Face the first open edge of the start cell (1,1). The generator always
  // leaves at least one passable edge.
  const start = maze[1]?.[1];

  if (!start) return -Math.PI / 2;
  if (!hasWall(start, WALL_EAST)) return -Math.PI / 2; // east
  if (!hasWall(start, WALL_SOUTH)) return Math.PI;      // south
  if (!hasWall(start, WALL_WEST)) return Math.PI / 2;   // west
  if (!hasWall(start, WALL_NORTH)) return 0;            // north
  return -Math.PI / 2;
};

export const placeCats = (maze) => {
  const cats = [];
  const catColors = ['white', 'black', 'gray', 'mix'];
  const width = maze[0].length;
  const height = maze.length;
  const maxAttempts = width * height;
  let attempts = 0;

  while (cats.length < 6 && attempts < maxAttempts) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);

    if (
      x > 0 && x < width - 1 &&
      y > 0 && y < height - 1 &&
      !(x === 1 && y === 1) &&
      !cats.some((cat) => cat.x === x && cat.y === y)
    ) {
      cats.push({
        x,
        y,
        color: catColors[Math.floor(Math.random() * catColors.length)],
      });
    }

    attempts += 1;
  }

  return cats;
};

export const generateMaze = () => {
  const { MAZE_WIDTH, MAZE_HEIGHT } = GAME_CONFIG;
  const maze = createEmptyMaze(MAZE_WIDTH, MAZE_HEIGHT);

  carvePassages(maze, 1, 1);

  const exitX = MAZE_WIDTH - 2;
  const exitY = MAZE_HEIGHT - 2;
  maze[exitY][exitX].exit = true;

  createRooms(maze, Math.floor(Math.random() * 3) + 3);
  const cats = placeCats(maze);

  return { maze, exitX, exitY, cats };
};
