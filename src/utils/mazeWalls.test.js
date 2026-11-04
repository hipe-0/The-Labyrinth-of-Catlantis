import { createEmptyMaze } from './mazeGeneration';
import { getMazeWallSegments } from './mazeWalls';

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
});
