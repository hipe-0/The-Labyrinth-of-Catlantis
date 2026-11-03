import { generateMaze, getStartRotation } from './mazeGeneration';

const startNeighbourFor = (rotation) => ({
  x: 1 + Math.round(-Math.sin(rotation)),
  z: 1 + Math.round(-Math.cos(rotation)),
});

describe('getStartRotation', () => {
  it('always faces an open neighbour of the start cell', () => {
    for (let i = 0; i < 250; i++) {
      const { maze } = generateMaze();
      const { x, z } = startNeighbourFor(getStartRotation(maze));

      expect(maze[z][x]).not.toBe(1);
    }
  });
});
