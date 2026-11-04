import {
  generateMaze,
  getStartRotation,
  hasWall,
  isValidMazeCoordinate,
  WALL_EAST,
  WALL_NORTH,
  WALL_SOUTH,
  WALL_WEST,
} from './mazeGeneration';

const DIRECTIONS = [
  { dx: 0, dz: -1, wall: WALL_NORTH },
  { dx: 1, dz: 0, wall: WALL_EAST },
  { dx: 0, dz: 1, wall: WALL_SOUTH },
  { dx: -1, dz: 0, wall: WALL_WEST },
];

const wallForRotation = (rotation) => {
  const dx = Math.round(-Math.sin(rotation));
  const dz = Math.round(-Math.cos(rotation));

  if (dx === 1) return WALL_EAST;
  if (dx === -1) return WALL_WEST;
  if (dz === 1) return WALL_SOUTH;
  return WALL_NORTH;
};

const reachableCellCount = (maze) => {
  const startX = 1;
  const startZ = 1;
  const queue = [[startX, startZ]];
  const visited = new Set([`${startX},${startZ}`]);

  while (queue.length > 0) {
    const [x, z] = queue.shift();
    const cell = maze[z][x];

    for (const { dx, dz, wall } of DIRECTIONS) {
      const nextX = x + dx;
      const nextZ = z + dz;

      if (
        isValidMazeCoordinate(maze, nextX, nextZ) &&
        !hasWall(cell, wall) &&
        !visited.has(`${nextX},${nextZ}`)
      ) {
        visited.add(`${nextX},${nextZ}`);
        queue.push([nextX, nextZ]);
      }
    }
  }

  return visited.size;
};

describe('edge-based maze generation', () => {
  it('always faces an open edge of the start cell', () => {
    for (let i = 0; i < 250; i += 1) {
      const { maze } = generateMaze();
      const wall = wallForRotation(getStartRotation(maze));

      expect(hasWall(maze[1][1], wall)).toBe(false);
    }
  });

  it('keeps every cell reachable from the start', () => {
    for (let i = 0; i < 25; i += 1) {
      const { maze } = generateMaze();

      expect(reachableCellCount(maze)).toBe(maze.length * maze[0].length);
    }
  });

  it('walls the outer boundary', () => {
    const { maze } = generateMaze();
    const height = maze.length;
    const width = maze[0].length;

    for (let x = 0; x < width; x += 1) {
      expect(hasWall(maze[0][x], WALL_NORTH)).toBe(true);
      expect(hasWall(maze[height - 1][x], WALL_SOUTH)).toBe(true);
    }

    for (let z = 0; z < height; z += 1) {
      expect(hasWall(maze[z][0], WALL_WEST)).toBe(true);
      expect(hasWall(maze[z][width - 1], WALL_EAST)).toBe(true);
    }
  });

  it('places six unique cats in the interior', () => {
    const { maze, cats } = generateMaze();
    const width = maze[0].length;
    const height = maze.length;
    const keys = new Set(cats.map((cat) => `${cat.x},${cat.y}`));

    expect(cats).toHaveLength(6);
    expect(keys.size).toBe(cats.length);

    for (const cat of cats) {
      expect(cat.x).toBeGreaterThan(0);
      expect(cat.x).toBeLessThan(width - 1);
      expect(cat.y).toBeGreaterThan(0);
      expect(cat.y).toBeLessThan(height - 1);
    }
  });
});
