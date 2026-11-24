import { createMovementController } from './movementController';
import { GAME_CONFIG } from '../config/gameConfig';
import {
  generateMaze,
  hasWall,
  WALL_EAST,
  WALL_NORTH,
  WALL_SOUTH,
  WALL_WEST,
} from './mazeGeneration';

const { INPUT } = GAME_CONFIG;

const createPlayer = (overrides = {}) => ({
  x: 1,
  y: 1,
  rotation: 0,
  pitch: 0,
  movementAccumulator: 0,
  jumpVelocity: 0,
  jumpHeight: 0,
  isJumping: false,
  collectedCats: new Set(),
  ...overrides,
});

const createController = ({
  maze = [],
  player,
  cats = [],
  setCollectedCats = jest.fn(),
  setSkyIndex = jest.fn(),
  onCatCollected = jest.fn(),
} = {}) =>
  createMovementController(
    maze,
    { current: player },
    setCollectedCats,
    setSkyIndex,
    cats,
    onCatCollected
  );

const runFrames = (controller, player, frames, delta = 1 / 60) => {
  for (let frame = 0; frame < frames; frame += 1) {
    controller.updatePlayerMovement(player, delta);
  }
};

const createOpenMaze = (size) =>
  Array.from({ length: size }, (_, z) =>
    Array.from({ length: size }, (_, x) =>
      x === 0 || z === 0 || x === size - 1 || z === size - 1 ? 1 : 0
    )
  );

const openRoomMaze = [
  [1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1],
];

describe('movementController keyboard movement', () => {
  it('walks forward relative to the current yaw', () => {
    const player = createPlayer({ x: 7, y: 7, rotation: 0 });
    const controller = createController({
      maze: createOpenMaze(15),
      player,
    });

    controller.handleKeyDown({ key: 'w' });
    runFrames(controller, player, 30);

    expect(player.x).toBeCloseTo(7, 5);
    expect(player.y).toBeLessThan(7);
  });

  it('supports backward movement with S and ArrowDown', () => {
    const player = createPlayer({ x: 7, y: 7, rotation: 0 });
    const controller = createController({
      maze: createOpenMaze(15),
      player,
    });

    controller.handleKeyDown({ key: 'ArrowDown' });
    runFrames(controller, player, 30);
    controller.handleKeyUp({ key: 'ArrowDown' });

    expect(player.y).toBeGreaterThan(7);
    expect(player.x).toBeCloseTo(7, 5);

    const playerWithS = createPlayer({ x: 7, y: 7, rotation: 0 });
    const controllerWithS = createController({
      maze: createOpenMaze(15),
      player: playerWithS,
    });

    controllerWithS.handleKeyDown({ key: 's' });
    runFrames(controllerWithS, playerWithS, 30);

    expect(playerWithS.y).toBeCloseTo(player.y, 6);
  });

  it('strafes left and right with A/D and arrow keys', () => {
    const rightPlayer = createPlayer({ x: 7, y: 7, rotation: 0 });
    const rightController = createController({
      maze: createOpenMaze(15),
      player: rightPlayer,
    });

    rightController.handleKeyDown({ key: 'd' });
    runFrames(rightController, rightPlayer, 20);

    expect(rightPlayer.x).toBeGreaterThan(7);
    expect(rightPlayer.y).toBeCloseTo(7, 5);

    const leftPlayer = createPlayer({ x: 7, y: 7, rotation: 0 });
    const leftController = createController({
      maze: createOpenMaze(15),
      player: leftPlayer,
    });

    leftController.handleKeyDown({ key: 'ArrowLeft' });
    runFrames(leftController, leftPlayer, 20);

    expect(leftPlayer.x).toBeLessThan(7);
    expect(leftPlayer.y).toBeCloseTo(7, 5);
  });

  it('does not speed up diagonally', () => {
    const forwardPlayer = createPlayer({ x: 7, y: 7, rotation: 0 });
    const forwardController = createController({
      maze: createOpenMaze(15),
      player: forwardPlayer,
    });

    forwardController.handleKeyDown({ key: 'w' });
    runFrames(forwardController, forwardPlayer, 30);

    const diagonalPlayer = createPlayer({ x: 7, y: 7, rotation: 0 });
    const diagonalController = createController({
      maze: createOpenMaze(15),
      player: diagonalPlayer,
    });

    diagonalController.handleKeyDown({ key: 'w' });
    diagonalController.handleKeyDown({ key: 'd' });
    runFrames(diagonalController, diagonalPlayer, 30);

    const forwardDistance = Math.hypot(
      forwardPlayer.x - 7,
      forwardPlayer.y - 7
    );
    const diagonalDistance = Math.hypot(
      diagonalPlayer.x - 7,
      diagonalPlayer.y - 7
    );

    expect(diagonalDistance).toBeCloseTo(forwardDistance, 5);
  });

  it('stops immediately when input is reset', () => {
    const player = createPlayer({ x: 7, y: 7, rotation: 0 });
    const controller = createController({
      maze: createOpenMaze(15),
      player,
    });

    controller.handleKeyDown({ key: 'w' });
    runFrames(controller, player, 10);
    controller.resetInput();

    const stoppedAt = { x: player.x, y: player.y };
    runFrames(controller, player, 30);

    expect(player.x).toBeCloseTo(stoppedAt.x, 8);
    expect(player.y).toBeCloseTo(stoppedAt.y, 8);
  });
});

describe('movementController mouse and stick look', () => {
  it('turns the view with pointer-locked mouse movement', () => {
    const player = createPlayer();
    const controller = createController({ player });

    controller.handleMouseMove(100, 50);
    controller.updatePlayerMovement(player, 1 / 60);

    expect(player.rotation).toBeCloseTo(-100 * INPUT.MOUSE_SENSITIVITY, 6);
    expect(player.pitch).toBeCloseTo(-50 * INPUT.MOUSE_SENSITIVITY, 6);
  });

  it('clamps vertical mouse look to the configured limit', () => {
    const player = createPlayer();
    const controller = createController({ player });

    controller.handleMouseMove(0, -100000);
    controller.updatePlayerMovement(player, 1 / 60);

    expect(player.pitch).toBeCloseTo(INPUT.PITCH_LIMIT, 6);
  });

  it('turns and pitches with the right stick', () => {
    const player = createPlayer();
    const controller = createController({ player });

    controller.setLookInput(1, 1);
    runFrames(controller, player, 30);

    expect(player.rotation).toBeLessThan(0);
    expect(player.pitch).toBeGreaterThan(0);
  });

  it('ignores right-stick drift inside the dead zone', () => {
    const player = createPlayer();
    const controller = createController({ player });

    controller.setLookInput(0.05, 0.05);
    runFrames(controller, player, 30);

    expect(player.rotation).toBeCloseTo(0, 8);
    expect(player.pitch).toBeCloseTo(0, 8);
  });
});

describe('movementController analog movement', () => {
  it('ignores left-stick drift inside the dead zone', () => {
    const player = createPlayer({ x: 7, y: 7, rotation: 0 });
    const controller = createController({
      maze: createOpenMaze(15),
      player,
    });

    controller.setMoveInput(0, 0.05);
    runFrames(controller, player, 60);

    expect(player.x).toBeCloseTo(7, 8);
    expect(player.y).toBeCloseTo(7, 8);
  });

  it('moves at a partial speed for a partial stick deflection', () => {
    const fullPlayer = createPlayer({ x: 7, y: 7, rotation: 0 });
    const fullController = createController({
      maze: createOpenMaze(15),
      player: fullPlayer,
    });

    fullController.setMoveInput(0, 1);
    runFrames(fullController, fullPlayer, 30);

    const halfPlayer = createPlayer({ x: 7, y: 7, rotation: 0 });
    const halfController = createController({
      maze: createOpenMaze(15),
      player: halfPlayer,
    });

    halfController.setMoveInput(0, 0.56);
    runFrames(halfController, halfPlayer, 30);

    const fullDistance = Math.hypot(fullPlayer.x - 7, fullPlayer.y - 7);
    const halfDistance = Math.hypot(halfPlayer.x - 7, halfPlayer.y - 7);
    const expectedRatio =
      (0.56 - INPUT.STICK_DEAD_ZONE) / (1 - INPUT.STICK_DEAD_ZONE);

    expect(halfDistance).toBeGreaterThan(0);
    expect(halfDistance).toBeLessThan(fullDistance);
    expect(halfDistance / fullDistance).toBeCloseTo(expectedRatio, 2);
  });
});

describe('movementController jump', () => {
  it('jumps on Space and lands again', () => {
    const player = createPlayer();
    const controller = createController({ player });

    controller.handleKeyDown({ key: ' ' });

    expect(player.isJumping).toBe(true);
    expect(player.jumpHeight).toBe(0);

    runFrames(controller, player, 120, 1 / 60);

    expect(player.isJumping).toBe(false);
    expect(player.jumpHeight).toBe(0);
    expect(player.jumpVelocity).toBe(0);
  });

  it('accepts jump requests from the touch button', () => {
    const player = createPlayer();
    const controller = createController({ player });

    controller.requestJump();

    expect(player.isJumping).toBe(true);
  });
});

describe('movementController collision and pickups', () => {
  it('stops the player circle before a wall', () => {
    const player = createPlayer({
      x: 2,
      y: 3,
      rotation: -Math.PI / 2,
    });
    const controller = createController({
      maze: openRoomMaze,
      player,
    });

    controller.handleKeyDown({ key: 'w' });
    runFrames(controller, player, 240);

    expect(player.x).toBeCloseTo(4.3, 5);
    expect(player.y).toBeCloseTo(3, 5);
  });

  it('collects a cat while moving backward', () => {
    const player = createPlayer({ x: 7, y: 7, rotation: 0 });
    const cats = [{ x: 7, y: 8.2, color: 'white' }];
    const setCollectedCats = jest.fn();
    const setSkyIndex = jest.fn();
    const onCatCollected = jest.fn();
    const controller = createController({
      maze: createOpenMaze(15),
      player,
      cats,
      setCollectedCats,
      setSkyIndex,
      onCatCollected,
    });

    controller.handleKeyDown({ key: 's' });
    runFrames(controller, player, 30);

    expect(player.collectedCats.has(0)).toBe(true);
    expect(setCollectedCats).toHaveBeenCalled();
    expect(setSkyIndex).toHaveBeenLastCalledWith(1);
    expect(onCatCollected).toHaveBeenCalledWith(0);
  });

  it('collects a cat when the circle gets close enough', () => {
    const player = createPlayer({
      x: 1,
      y: 3,
      rotation: -Math.PI / 2,
    });
    const setCollectedCats = jest.fn();
    const setSkyIndex = jest.fn();
    const onCatCollected = jest.fn();
    const cats = [{ x: 3, y: 3, color: 'white' }];
    const controller = createController({
      maze: openRoomMaze,
      player,
      cats,
      setCollectedCats,
      setSkyIndex,
      onCatCollected,
    });

    controller.handleKeyDown({ key: 'w' });
    runFrames(controller, player, 90);

    expect(player.collectedCats.has(0)).toBe(true);
    expect(setCollectedCats).toHaveBeenCalled();
    expect(setSkyIndex).toHaveBeenLastCalledWith(1);
    expect(onCatCollected).toHaveBeenCalledWith(0);

    // Staying near an already-collected cat must not replay the meow forever.
    controller.handleKeyUp({ key: 'w' });
    runFrames(controller, player, 60);

    expect(onCatCollected).toHaveBeenCalledTimes(1);
  });

  it('can follow a corridor path through a generated maze', () => {
    const { maze, exitX, exitY } = generateMaze();
    const player = createPlayer();
    const controller = createController({ maze, player });

    const neighbours = [
      { dx: 0, dz: -1, wall: WALL_NORTH },
      { dx: 0, dz: 1, wall: WALL_SOUTH },
      { dx: -1, dz: 0, wall: WALL_WEST },
      { dx: 1, dz: 0, wall: WALL_EAST },
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

      for (const { dx, dz, wall } of neighbours) {
        const x = current.x + dx;
        const z = current.z + dz;

        if (
          maze[z]?.[x] &&
          !hasWall(maze[current.z][current.x], wall) &&
          !visited.has(keyOf(x, z))
        ) {
          visited.add(keyOf(x, z));
          queue.push({ x, z, path: [...current.path, { dx, dz }] });
        }
      }
    }

    expect(path).not.toBeNull();

    controller.handleKeyDown({ key: 'w' });

    for (const { dx, dz } of path) {
      player.rotation = Math.atan2(-dx, -dz);

      for (let frame = 0; frame < 40; frame += 1) {
        controller.updatePlayerMovement(player, 1 / 144);
      }
    }

    controller.handleKeyUp({ key: 'w' });

    expect(Math.hypot(player.x - exitX, player.y - exitY)).toBeLessThan(0.5);
  });
});
