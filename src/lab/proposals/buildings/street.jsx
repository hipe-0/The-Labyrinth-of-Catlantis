// src/lab/proposals/buildings/street.jsx
//
// Shared diorama for the buildings proposal: a small deterministic maze with
// five 1x1 building cells that block all four passages. Each numbered option
// only changes the building treatment; the maze, heights, and camera stay
// identical so the comparison is honest.

import React, { useMemo } from 'react';
import * as THREE from 'three';

import { WallBox } from '../../LabStage';
import { GAME_CONFIG } from '../../../config/gameConfig';
import {
  WALL_NORTH,
  WALL_EAST,
  WALL_SOUTH,
  WALL_WEST,
  createEmptyMaze,
  removeWall,
} from '../../../utils/mazeGeneration';
import { getMazeWallSegments } from '../../../utils/mazeWalls';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 7;

// Heights span the whole randomised 1.0–3.0 range, so one view shows a hut, a
// house, mid-rises, and a tower. Every building is exactly one cell (1x1).
// The back row descends left-to-right; the two short blocks sit in front.
export const BUILDINGS = [
  { x: 2, z: 2, height: 2.9 },
  { x: 4, z: 2, height: 2.35 },
  { x: 7, z: 2, height: 2.05 },
  { x: 3, z: 4, height: 1.08 },
  { x: 6, z: 4, height: 1.55 },
];

const DIRECTIONS = [
  { dx: 0, dz: -1, wall: WALL_NORTH, opposite: WALL_SOUTH },
  { dx: 1, dz: 0, wall: WALL_EAST, opposite: WALL_WEST },
  { dx: 0, dz: 1, wall: WALL_SOUTH, opposite: WALL_NORTH },
  { dx: -1, dz: 0, wall: WALL_WEST, opposite: WALL_EAST },
];

const UNIT_EDGES = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

const makeRandom = (seed) => {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const cellKey = (x, z) => `${x},${z}`;

// Buildings are inserted first: the backtracker never enters their cells, so
// the labyrinth is carved around five sealed 1x1 blocks.
const createStreetMaze = () => {
  const maze = createEmptyMaze(GRID_WIDTH, GRID_HEIGHT);
  const blocked = new Set(
    BUILDINGS.map((building) => cellKey(building.x, building.z))
  );
  const random = makeRandom(20261124);
  const visited = new Set([cellKey(1, 1)]);
  const stack = [{ x: 1, z: 1 }];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const open = DIRECTIONS
      .map((direction) => ({
        ...direction,
        x: current.x + direction.dx,
        z: current.z + direction.dz,
      }))
      .filter(({ x, z }) => (
        x >= 0 && x < GRID_WIDTH &&
        z >= 0 && z < GRID_HEIGHT &&
        !blocked.has(cellKey(x, z)) &&
        !visited.has(cellKey(x, z))
      ));

    if (open.length === 0) {
      stack.pop();
      continue;
    }

    const next = open[Math.floor(random() * open.length)];
    removeWall(maze[current.z][current.x], next.wall);
    removeWall(maze[next.z][next.x], next.opposite);
    visited.add(cellKey(next.x, next.z));
    stack.push({ x: next.x, z: next.z });
  }

  // A building cell blocks all four passages. Clear the neighbours' facing
  // walls and emit no wall panels for the cell itself, so the block itself is
  // the walled cell — just taller.
  for (const building of BUILDINGS) {
    for (const direction of DIRECTIONS) {
      const x = building.x + direction.dx;
      const z = building.z + direction.dz;

      if (x >= 0 && x < GRID_WIDTH && z >= 0 && z < GRID_HEIGHT) {
        removeWall(maze[z][x], direction.opposite);
      }
    }

    maze[building.z][building.x].walls = 0;
  }

  // Cut the maze open at the front (z >= 5) so the diorama reads as a section
  // through the labyrinth instead of a boxed-in view with a huge front wall.
  for (let z = 5; z < GRID_HEIGHT; z += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      maze[z][x].walls = 0;
    }
  }

  return maze;
};

function StreetWalls({ maze }) {
  const segments = useMemo(() => getMazeWallSegments(maze), [maze]);

  return segments.map((segment) => (
    <WallBox
      key={segment.key}
      position={[
        (segment.minX + segment.maxX) / 2,
        GAME_CONFIG.WALL.HEIGHT / 2,
        (segment.minZ + segment.maxZ) / 2,
      ]}
      size={[
        segment.maxX - segment.minX,
        GAME_CONFIG.WALL.HEIGHT,
        segment.maxZ - segment.minZ,
      ]}
    />
  ));
}

const FACE_LAYOUTS = [
  { spreadAxis: 'x', rotationY: 0, x: 0, z: 0.505 },
  { spreadAxis: 'x', rotationY: Math.PI, x: 0, z: -0.505 },
  { spreadAxis: 'z', rotationY: Math.PI / 2, x: 0.505, z: 0 },
  { spreadAxis: 'z', rotationY: -Math.PI / 2, x: -0.505, z: 0 },
];

const WINDOW_COLUMNS = [-0.21, 0.21];

function WindowLights({ building }) {
  const windows = useMemo(() => {
    const random = makeRandom(Math.imul(building.x + 7, 92837111) ^ Math.imul(building.z + 11, 689287499));
    const rows = [];

    for (let y = 0.62; y <= building.height - 0.14; y += 0.44) {
      rows.push(y);
    }

    const result = [];

    for (const face of FACE_LAYOUTS) {
      for (const y of rows) {
        for (const spread of WINDOW_COLUMNS) {
          result.push({
            key: `${face.rotationY}:${y}:${spread}`,
            lit: random() < 0.62,
            position: [
              face.spreadAxis === 'x' ? spread : face.x,
              y,
              face.spreadAxis === 'z' ? spread : face.z,
            ],
            rotationY: face.rotationY,
          });
        }
      }
    }

    return result;
  }, [building]);

  return windows.map((window) => (
    <mesh
      key={window.key}
      position={window.position}
      rotation={[0, window.rotationY, 0]}
    >
      <planeGeometry args={[0.17, 0.2]} />
      <meshStandardMaterial
        color={window.lit ? '#ffdca8' : '#131a2b'}
        emissive={window.lit ? '#ff9d3c' : '#000000'}
        emissiveIntensity={window.lit ? 1.6 : 0}
        metalness={0}
        roughness={0.4}
      />
    </mesh>
  ));
}

const ROOF_COLOR = '#2C3450';

function RoofCap({ building, pyramidal }) {
  if (pyramidal) {
    return (
      <mesh
        position={[0, building.height + 0.16, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[0.78, 0.32, 4]} />
        <meshStandardMaterial color={ROOF_COLOR} metalness={0} roughness={0.6} />
      </mesh>
    );
  }

  return (
    <mesh
      position={[0, building.height + 0.05, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1.1, 0.1, 1.1]} />
      <meshStandardMaterial color={ROOF_COLOR} metalness={0} roughness={0.6} />
    </mesh>
  );
}

function Building({ building, index, treatment }) {
  const bodyColor = '#FFFFFF';

  return (
    <group position={[building.x, 0, building.z]}>
      <mesh
        position={[0, building.height / 2, 0]}
        scale={[1, building.height, 1]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={bodyColor} metalness={0} roughness={0.55} />
      </mesh>

      <lineSegments
        geometry={UNIT_EDGES}
        position={[0, building.height / 2, 0]}
        scale={[1, building.height, 1]}
      >
        <lineBasicMaterial color="#FFFFFF" linewidth={2} />
      </lineSegments>

      {treatment === 'windows' && <WindowLights building={building} />}
      {treatment === 'roofs' && (
        <RoofCap building={building} pyramidal={index % 2 === 1} />
      )}
    </group>
  );
}

export function StreetScene({ treatment = null }) {
  const maze = useMemo(() => createStreetMaze(), []);

  return (
    <>
      <StreetWalls maze={maze} />
      {treatment && BUILDINGS.map((building, index) => (
        <Building
          key={cellKey(building.x, building.z)}
          building={building}
          index={index}
          treatment={treatment}
        />
      ))}
    </>
  );
}
