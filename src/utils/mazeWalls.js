// src/utils/mazeWalls.js
//
// Converts edge-based maze cells into unique thin wall segments. Collinear runs
// are merged into a single box, which keeps draw calls down and gives the maze
// long clean walls instead of one seam per cell. At an L corner the horizontal
// run takes the corner square (its end moves half a thickness past the lattice
// point) and the vertical wall trims its end onto the horizontal's face, so the
// two boxes abut edge-to-edge: no floating tab, no overlapping volume, no
// coplanar faces that z-fight. Where a wall merely passes through a lattice
// point its cap stays at the cell boundary (hidden inside the crossing wall),
// preserving the old blink-free behaviour. The same list is used for rendering
// and collision, so the two can never disagree.

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

// Number of perpendicular wall arms at lattice point (boundaryX, boundaryZ):
// 0 = free end, 1 = L corner (both walls end here), 2 = pass-through.
const verticalArmsAt = (vertical, boundaryX, boundaryZ) => {
  const rows = vertical.get(boundaryX);

  if (!rows) {
    return 0;
  }

  return (
    (rows.has(boundaryZ - HALF_CELL) ? 1 : 0) +
    (rows.has(boundaryZ + HALF_CELL) ? 1 : 0)
  );
};

const horizontalArmsAt = (horizontal, boundaryX, boundaryZ) => {
  const cols = horizontal.get(boundaryZ);

  if (!cols) {
    return 0;
  }

  return (
    (cols.has(boundaryX - HALF_CELL) ? 1 : 0) +
    (cols.has(boundaryX + HALF_CELL) ? 1 : 0)
  );
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
      const leftX = startX - HALF_CELL;
      const rightX = endX + HALF_CELL;

      // Only extend over a vertical wall that ends at this lattice point
      // (an L corner). A passing vertical wall owns the corner square, so the
      // horizontal cap stays flush with it instead of overlapping its face.
      const leftArms = verticalArmsAt(vertical, leftX, boundaryZ);
      const rightArms = verticalArmsAt(vertical, rightX, boundaryZ);

      segments.push({
        key: `h:${boundaryZ}:${startX}:${endX}`,
        orientation: 'horizontal',
        minX:
          leftX - (leftArms === 1 ? halfThickness : 0),
        maxX:
          rightX + (rightArms === 1 ? halfThickness : 0),
        minZ: boundaryZ - halfThickness,
        maxZ: boundaryZ + halfThickness,
      });
    }
  }

  for (const [boundaryX, zs] of vertical) {
    for (const [startZ, endZ] of getRuns(zs)) {
      const bottomZ = startZ - HALF_CELL;
      const topZ = endZ + HALF_CELL;

      // Mirror of the horizontal rule: trim a vertical end only at an L
      // corner, onto the horizontal wall's face plane.
      const bottomArms = horizontalArmsAt(horizontal, boundaryX, bottomZ);
      const topArms = horizontalArmsAt(horizontal, boundaryX, topZ);

      segments.push({
        key: `v:${boundaryX}:${startZ}:${endZ}`,
        orientation: 'vertical',
        minX: boundaryX - halfThickness,
        maxX: boundaryX + halfThickness,
        minZ: bottomZ + (bottomArms === 1 ? halfThickness : 0),
        maxZ: topZ - (topArms === 1 ? halfThickness : 0),
      });
    }
  }

  return segments;
};
