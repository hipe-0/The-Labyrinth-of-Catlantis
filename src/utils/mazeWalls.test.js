import { createEmptyMaze, WALL_EAST, WALL_NORTH } from './mazeGeneration';
import { getMazeWallSegments } from './mazeWalls';
import { GAME_CONFIG } from '../config/gameConfig';

const halfThickness = () => GAME_CONFIG.WALL.THICKNESS / 2;

describe('getMazeWallSegments', () => {
  it('merges collinear runs and deduplicates shared edges', () => {
    // A fully walled 2x2 grid has three horizontal boundary lines and three
    // vertical boundary lines once shared edges are merged.
    const segments = getMazeWallSegments(createEmptyMaze(2, 2));

    expect(segments).toHaveLength(6);
    expect(segments.filter((segment) => segment.orientation === 'horizontal'))
      .toHaveLength(3);
    expect(segments.filter((segment) => segment.orientation === 'vertical'))
      .toHaveLength(3);
  });

  it('returns non-overlapping non-zero boxes', () => {
    const segments = getMazeWallSegments(createEmptyMaze(3, 3));

    for (const segment of segments) {
      expect(segment.maxX).toBeGreaterThan(segment.minX);
      expect(segment.maxZ).toBeGreaterThan(segment.minZ);
    }

    const keys = new Set(segments.map((segment) => segment.key));
    expect(keys.size).toBe(segments.length);
  });

  it('expands a horizontal run over the vertical wall that joins its end', () => {
    // Horizontal wall along z = 1.5 covering columns 2-3, with a vertical wall
    // joining at its right end (x = 3.5) from row 2. Cells start fully walled,
    // so clear every bit first.
    const maze = createEmptyMaze(4, 4);

    for (const row of maze) {
      for (const cell of row) {
        cell.walls = 0;
      }
    }

    maze[2][2].walls |= WALL_NORTH;
    maze[2][3].walls |= WALL_NORTH;
    maze[2][3].walls |= WALL_EAST;

    const segments = getMazeWallSegments(maze);
    const horizontal = segments.find(
      (segment) => segment.orientation === 'horizontal'
    );
    const vertical = segments.find(
      (segment) => segment.orientation === 'vertical'
    );

    // The run's end moves to the vertical wall's outer face so there is no
    // protruding tab at the corner.
    expect(horizontal.maxX).toBeCloseTo(3.5 + halfThickness(), 6);
    // Nothing joins the left end, so it stays flush with the cell boundary.
    expect(horizontal.minX).toBeCloseTo(1.5, 6);
    // The vertical trims onto the horizontal's far face: boxes abut edge to
    // edge, no overlapping volume and no coplanar faces.
    expect(vertical.minZ).toBeCloseTo(1.5 + halfThickness(), 6);
    expect(vertical.maxZ).toBeCloseTo(2.5, 6);
  });

  it('does not extend a horizontal run over a passing vertical wall', () => {
    // T junction: horizontal wall ends against a vertical wall that passes
    // straight through its line. The horizontal cap must stay at the cell
    // boundary (hidden inside the vertical's body) so no coplanar faces are
    // created and nothing blinks.
    const maze = createEmptyMaze(4, 4);

    for (const row of maze) {
      for (const cell of row) {
        cell.walls = 0;
      }
    }

    maze[2][2].walls |= WALL_NORTH;
    maze[2][3].walls |= WALL_NORTH;
    maze[1][3].walls |= WALL_EAST;
    maze[2][3].walls |= WALL_EAST;

    const segments = getMazeWallSegments(maze);
    const horizontal = segments.find(
      (segment) => segment.orientation === 'horizontal'
    );
    const vertical = segments.find(
      (segment) => segment.orientation === 'vertical'
    );

    expect(horizontal.maxX).toBeCloseTo(3.5, 6);
    expect(vertical.minZ).toBeCloseTo(0.5, 6);
    expect(vertical.maxZ).toBeCloseTo(2.5, 6);
  });

  it('trims a vertical end onto a horizontal wall at an L corner', () => {
    // Mirror of the first corner test: horizontal extends past the lattice
    // point, vertical end moves onto the horizontal's face plane.
    const maze = createEmptyMaze(4, 4);

    for (const row of maze) {
      for (const cell of row) {
        cell.walls = 0;
      }
    }

    maze[2][2].walls |= WALL_NORTH;
    maze[2][3].walls |= WALL_NORTH;
    maze[1][3].walls |= WALL_EAST;

    const segments = getMazeWallSegments(maze);
    const horizontal = segments.find(
      (segment) => segment.orientation === 'horizontal'
    );
    const vertical = segments.find(
      (segment) => segment.orientation === 'vertical'
    );

    expect(horizontal.maxX).toBeCloseTo(3.5 + halfThickness(), 6);
    expect(vertical.minZ).toBeCloseTo(0.5, 6);
    expect(vertical.maxZ).toBeCloseTo(1.5 - halfThickness(), 6);
  });
});

