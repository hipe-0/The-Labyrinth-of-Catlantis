// src/utils/mazeWalls.js
//
// Converts edge-based maze cells into unique thin wall segments. Collinear runs
// are merged into a single box, which keeps draw calls down and gives the maze
// long clean walls instead of one seam per cell. The same list is used for
// rendering and collision, so the two can never disagree.

import { GAME_CONFIG } from '../config/gameConfig';
import {
  WALL_NORTH,
  WALL_EAST,
  WALL_SOUTH,
  WALL_WEST,
  hasWall,
} from './mazeGeneration';

const HALF_CELL = 0.5;

const addToSetMap = (map, key, value) => {
  const set = map.get(key);

  if (set) {
    set.add(value);
  } else {
    map.set(key, new Set([value]));
  }
};

const getRuns = (values) => {
  const sorted = Array.from(values).sort((a, b) => a - b);
  const runs = [];

  for (const value of sorted) {
    const last = runs[runs.length - 1];

    if (last && value === last[1] + 1) {
      last[1] = value;
    } else {
      runs.push([value, value]);
    }
  }

  return runs;
};

export const getMazeWallSegments = (maze) => {
  const thickness = GAME_CONFIG.WALL.THICKNESS;
  const halfThickness = thickness / 2;
  const horizontal = new Map();
  const vertical = new Map();

  for (let z = 0; z < maze.length; z += 1) {
    for (let x = 0; x < maze[z].length; x += 1) {
      const cell = maze[z][x];

      if (hasWall(cell, WALL_NORTH)) addToSetMap(horizontal, z - HALF_CELL, x);
      if (hasWall(cell, WALL_SOUTH)) addToSetMap(horizontal, z + HALF_CELL, x);
      if (hasWall(cell, WALL_WEST)) addToSetMap(vertical, x - HALF_CELL, z);
      if (hasWall(cell, WALL_EAST)) addToSetMap(vertical, x + HALF_CELL, z);
    }
  }

  const segments = [];

  for (const [boundaryZ, xs] of horizontal) {
    for (const [startX, endX] of getRuns(xs)) {
      segments.push({
        key: `h:${boundaryZ}:${startX}:${endX}`,
        orientation: 'horizontal',
        minX: startX - HALF_CELL,
        maxX: endX + HALF_CELL,
        minZ: boundaryZ - halfThickness,
        maxZ: boundaryZ + halfThickness,
      });
    }
  }

  for (const [boundaryX, zs] of vertical) {
    for (const [startZ, endZ] of getRuns(zs)) {
      segments.push({
        key: `v:${boundaryX}:${startZ}:${endZ}`,
        orientation: 'vertical',
        minX: boundaryX - halfThickness,
        maxX: boundaryX + halfThickness,
        minZ: startZ - HALF_CELL,
        maxZ: endZ + HALF_CELL,
      });
    }
  }

  return segments;
};
