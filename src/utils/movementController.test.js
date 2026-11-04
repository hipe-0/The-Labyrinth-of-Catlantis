import { createMovementController } from './movementController';
import { generateMaze } from './mazeGeneration';

const createPlayer = () => ({
  x: 1,
  y: 1,
  rotation: 0,
  targetX: 1,
  targetY: 1,
  targetRotation: 0,
  movementAccumulator: 0,
  jumpVelocity: 0,
  jumpHeight: 0,
  isJumping: false,
  collectedCats: new Set(),
});

const openRoomMaze = [
  [1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1],
];

describe('movementController rotation', () => {
  it('advances the target continuously while a turn key is held', () => {
    const player = createPlayer();
    const controller = createMovementController(
      [],
      { current: player },
      jest.fn(),
      jest.fn(),
      []
    );

    controller.handleKeyDown({ key: 'ArrowLeft' });

    const afterKeyDown = player.targetRotation;
    controller.updatePlayerMovement(player, 1 / 60, [], jest.fn(), jest.fn());

    expect(afterKeyDown).toBeCloseTo(Math.PI / 4);
    expect(player.targetRotation).toBeGreaterThan(afterKeyDown);
  });

  it('snaps the target to a 45° step after release', () => {
    const player = createPlayer();
    const controller = createMovementController(
      [],
      { current: player },
      jest.fn(),
      jest.fn(),
      []
    );

    controller.handleKeyDown({ key: 'ArrowLeft' });
    for (let i = 0; i < 12; i += 1) {
      controller.updatePlayerMovement(player, 1 / 60, [], jest.fn(), jest.fn());
    }
    controller.handleKeyUp({ key: 'ArrowLeft' });
    controller.updatePlayerMovement(player, 1 / 60, [], jest.fn(), jest.fn());

    const step = Math.PI / 4;
    expect(player.targetRotation / step).toBeCloseTo(
      Math.round(player.targetRotation / step)
    );
  });
});

describe('movementController collision and pickups', () => {
  it('stops the player circle before a wall', () => {
    const player = createPlayer();
    player.x = 2;
    player.y = 3;
    player.rotation = -Math.PI / 2;
    player.targetRotation = -Math.PI / 2;

    const controller = createMovementController(
      openRoomMaze,
      { current: player },
      jest.fn(),
      jest.fn(),
      []
    );

    controller.handleKeyDown({ key: 'ArrowUp' });

    for (let frame = 0; frame < 240; frame += 1) {
      controller.updatePlayerMovement(player, 1 / 60);
    }

    expect(player.x).toBeCloseTo(4.3, 5);
    expect(player.y).toBeCloseTo(3, 5);
  });

  it('collects a cat when the circle gets close enough', () => {
    const player = createPlayer();
    player.x = 1;
    player.y = 3;
    player.rotation = -Math.PI / 2;
    player.targetRotation = -Math.PI / 2;

    const setCollectedCats = jest.fn();
    const setSkyIndex = jest.fn();
    const onCatCollected = jest.fn();
    const cats = [{ x: 3, y: 3, color: 'white' }];
    const controller = createMovementController(
      openRoomMaze,
      { current: player },
      setCollectedCats,
      setSkyIndex,
      cats,
      onCatCollected
    );

    controller.handleKeyDown({ key: 'ArrowUp' });

    for (let frame = 0; frame < 90; frame += 1) {
      controller.updatePlayerMovement(player, 1 / 60);
    }

    expect(player.collectedCats.has(0)).toBe(true);
    expect(setCollectedCats).toHaveBeenCalled();
    expect(setSkyIndex).toHaveBeenLastCalledWith(1);
    expect(onCatCollected).toHaveBeenCalledWith(0);
  });

  it('can follow a corridor path through a generated maze', () => {
    const { maze, exitX, exitY } = generateMaze();
    const player = createPlayer();
    const controller = createMovementController(
      maze,
      { current: player },
      jest.fn(),
      jest.fn(),
      []
    );

    const neighbours = [
      { dx: 0, dz: -1 },
      { dx: 0, dz: 1 },
      { dx: -1, dz: 0 },
      { dx: 1, dz: 0 },
    ];
    const keyOf = (x, z) => `${x},${z}`;
    const queue = [{ x: 1, z: 1, path: [] }];
    const visited = new Set([keyOf(1, 1)]);
    let path = null;

    while (queue.length > 0 && !path) {
      const current = queue.shift();

      if (current.x === exitX && current.z === exitY) {
        path = current.path;
        break;
      }

      for (const { dx, dz } of neighbours) {
        const x = current.x + dx;
        const z = current.z + dz;

        if (
          maze[z]?.[x] !== 1 &&
          !visited.has(keyOf(x, z))
        ) {
          visited.add(keyOf(x, z));
          queue.push({ x, z, path: [...current.path, { dx, dz }] });
        }
      }
    }

    expect(path).not.toBeNull();

    controller.handleKeyDown({ key: 'ArrowUp' });

    for (const { dx, dz } of path) {
      const rotation = Math.atan2(-dx, -dz);
      player.rotation = rotation;
      player.targetRotation = rotation;

      for (let frame = 0; frame < 40; frame += 1) {
        controller.updatePlayerMovement(player, 1 / 144);
      }
    }

    controller.handleKeyUp({ key: 'ArrowUp' });

    expect(Math.hypot(player.x - exitX, player.y - exitY)).toBeLessThan(0.5);
  });
});
