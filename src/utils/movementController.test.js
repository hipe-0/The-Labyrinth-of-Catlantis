import { createMovementController } from './movementController';

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
