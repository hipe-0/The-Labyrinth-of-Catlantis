import {
  circleIntersectsBox,
  createCollisionWorld,
  createMazeCollisionWorld,
  moveCircle,
} from './collision';

const RADIUS = 0.2;
const openRoomMaze = [
  [1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1],
];

describe('circle collision', () => {
  it('detects and excludes tangency', () => {
    const box = { minX: 0, minZ: 0, maxX: 1, maxZ: 1 };

    expect(circleIntersectsBox(1.19, 0.5, RADIUS, box)).toBe(true);
    expect(circleIntersectsBox(1.2, 0.5, RADIUS, box)).toBe(false);
  });

  it('stops at a wall without penetrating it', () => {
    const world = createMazeCollisionWorld(openRoomMaze);
    const result = moveCircle(world, 2, 3, 10, 0, RADIUS);

    expect(result.blockedX).toBe(true);
    expect(result.x).toBeCloseTo(4.3, 6);
    expect(result.z).toBeCloseTo(3, 6);
    expect(world.overlapsCircle(result.x, result.z, RADIUS)).toBe(false);
  });

  it('slides along a wall when the movement is diagonal', () => {
    const world = createMazeCollisionWorld(openRoomMaze);
    const result = moveCircle(world, 1, 2, 2, 2, RADIUS);

    // The wall at (2,2) blocks the eastward part while the southward part
    // continues, so the circle rounds the corner instead of sticking.
    expect(result.z).toBeGreaterThan(3);
    expect(result.x).toBeGreaterThan(2);
    expect(world.overlapsCircle(result.x, result.z, RADIUS)).toBe(false);
  });

  it('resolves a circle that starts inside a wall', () => {
    const world = createCollisionWorld();
    world.addBox({ minX: 1.5, minZ: 1.5, maxX: 2.5, maxZ: 2.5 });

    const resolved = world.resolvePenetration(2, 2, RADIUS);

    expect(world.overlapsCircle(resolved.x, resolved.z, RADIUS)).toBe(false);
  });

  it('never penetrates a wall during a long random walk', () => {
    const world = createMazeCollisionWorld(openRoomMaze);
    const rotations = Array.from({ length: 8 }, (_, index) =>
      (index * Math.PI) / 4
    );
    let x = 1;
    let z = 1;

    for (let step = 0; step < 3000; step += 1) {
      const rotation = rotations[Math.floor(Math.random() * rotations.length)];
      const result = moveCircle(
        world,
        x,
        z,
        -Math.sin(rotation) * 0.08,
        -Math.cos(rotation) * 0.08,
        RADIUS
      );

      x = result.x;
      z = result.z;

      expect(world.overlapsCircle(x, z, RADIUS)).toBe(false);
      expect(x).toBeGreaterThanOrEqual(0.5 + RADIUS - 1e-6);
      expect(x).toBeLessThanOrEqual(4.5 - RADIUS + 1e-6);
      expect(z).toBeGreaterThanOrEqual(0.5 + RADIUS - 1e-6);
      expect(z).toBeLessThanOrEqual(4.5 - RADIUS + 1e-6);
    }
  });
});
