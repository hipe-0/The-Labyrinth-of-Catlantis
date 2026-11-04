// src/utils/movementController.js
import { GAME_CONFIG } from '../config/gameConfig';
import { createMazeCollisionWorld, moveCircle } from './collision';

export const createMovementController = (
  maze,
  playerRef,
  setCollectedCats,
  setSkyIndex,
  cats,
  onCatCollected
) => {
  const {
    MOVE_FIXED_STEP,
    ROTATE_SMOOTHING,
    ROTATION_ANGLE,
    ROTATION_STEP_INTERVAL,
    ROTATION_THRESHOLD,
    PLAYER
  } = GAME_CONFIG;

  const MAX_MOVEMENT_SUBSTEPS = 15;
  const ROTATION_SPEED = ROTATION_ANGLE / ROTATION_STEP_INTERVAL;
  const collisionWorld = createMazeCollisionWorld(maze);

  const keyState = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
  };

  const normalizeRotation = (rotation) => {
    // Ensure rotation is always a multiple of 45 degrees (PI/4)
    return Math.round(rotation / ROTATION_ANGLE) * ROTATION_ANGLE;
  };

  const handleKeyDown = (event) => {
    const player = playerRef.current;

    switch (event.key) {
      case 'ArrowUp':
        keyState.ArrowUp = true;
        break;
      case 'ArrowDown':
        keyState.ArrowDown = true;
        break;
      case 'ArrowLeft':
        if (!keyState.ArrowLeft) {
          keyState.ArrowLeft = true;
          player.targetRotation = normalizeRotation(
            player.targetRotation + ROTATION_ANGLE
          );
        }
        break;
      case 'ArrowRight':
        if (!keyState.ArrowRight) {
          keyState.ArrowRight = true;
          player.targetRotation = normalizeRotation(
            player.targetRotation - ROTATION_ANGLE
          );
        }
        break;
      case ' ':
        if (!player.isJumping) {
          player.isJumping = true;
          player.jumpVelocity = GAME_CONFIG.JUMP_VELOCITY;
          player.jumpHeight = 0;
        }
        break;
      default:
        break;
    }
  };

  const handleKeyUp = (event) => {
    switch (event.key) {
      case 'ArrowUp':
        keyState.ArrowUp = false;
        break;
      case 'ArrowDown':
        keyState.ArrowDown = false;
        break;
      case 'ArrowLeft':
        keyState.ArrowLeft = false;
        break;
      case 'ArrowRight':
        keyState.ArrowRight = false;
        break;
      default:
        break;
    }
  };

  const collectCatNear = (x, z) => {
    const catIndex = cats.findIndex((cat) =>
      Math.hypot(cat.x - x, cat.y - z) <= PLAYER.CAT_PICKUP_RADIUS
    );

    if (catIndex === -1) {
      return;
    }

    const newCollectedCats = new Set(playerRef.current.collectedCats);

    if (newCollectedCats.has(catIndex)) {
      return;
    }

    newCollectedCats.add(catIndex);
    playerRef.current.collectedCats = newCollectedCats;
    setCollectedCats(newCollectedCats);
    setSkyIndex(newCollectedCats.size);

    if (onCatCollected) {
      onCatCollected(catIndex);
    }
  };

  const movePlayer = (player) => {
    const direction =
      (keyState.ArrowUp ? 1 : 0) - (keyState.ArrowDown ? 1 : 0);

    if (direction === 0) {
      return;
    }

    const distance = PLAYER.WALK_SPEED * MOVE_FIXED_STEP * direction;
    const dx = -Math.sin(player.rotation) * distance;
    const dz = -Math.cos(player.rotation) * distance;
    const previousX = player.x;
    const previousZ = player.y;
    const result = moveCircle(
      collisionWorld,
      player.x,
      player.y,
      dx,
      dz,
      PLAYER.RADIUS
    );

    player.x = result.x;
    player.y = result.z;

    if (
      Math.abs(player.x - previousX) + Math.abs(player.y - previousZ) >
      1e-7
    ) {
      collectCatNear(player.x, player.y);
    }
  };

  const updatePlayerMovement = (player, delta) => {
    // Clamp very long frames (tab switches, stalls) so physics and rotation do
    // not jump by a large amount at once.
    const frameDelta = Math.min(delta, 0.1);

    // Jump physics with gravity
    if (player.isJumping) {
      player.jumpVelocity -= GAME_CONFIG.GRAVITY * frameDelta;
      player.jumpHeight += player.jumpVelocity * frameDelta;

      if (player.jumpHeight <= 0) {
        player.jumpHeight = 0;
        player.jumpVelocity = 0;
        player.isJumping = false;
      }
    }

    // Continuous rotation while a turn key/button is held. The target advances
    // at a constant angular speed instead of jumping every 45°, which removes
    // the visible stop-start "hiccups" at low rotation speeds. On release the
    // target snaps back to the nearest 45° so movement stays grid-aligned.
    const turnDirection =
      (keyState.ArrowLeft ? 1 : 0) - (keyState.ArrowRight ? 1 : 0);

    if (turnDirection !== 0) {
      player.targetRotation += turnDirection * ROTATION_SPEED * frameDelta;
    } else {
      player.targetRotation = normalizeRotation(player.targetRotation);
    }

    // Fixed-timestep movement. 144 Hz matches the original high-refresh PC
    // feel; 60 Hz phones run the same number of simulation steps per second.
    player.movementAccumulator = Math.min(
      (player.movementAccumulator || 0) + frameDelta,
      MOVE_FIXED_STEP * MAX_MOVEMENT_SUBSTEPS
    );

    let movementSteps = 0;
    while (
      player.movementAccumulator >= MOVE_FIXED_STEP &&
      movementSteps < MAX_MOVEMENT_SUBSTEPS
    ) {
      movePlayer(player);
      player.movementAccumulator -= MOVE_FIXED_STEP;
      movementSteps++;
    }

    // Smooth rotation interpolation. Exponential smoothing is frame-rate
    // independent, so the turn feels the same at 30, 60, or 144 fps.
    const rotationBlend = 1 - Math.exp(-ROTATE_SMOOTHING * frameDelta);
    player.rotation += (player.targetRotation - player.rotation) * rotationBlend;

    // Precise rotation alignment
    if (Math.abs(player.rotation - player.targetRotation) < ROTATION_THRESHOLD) {
      player.rotation = player.targetRotation;
    }
  };

  return {
    handleKeyDown,
    handleKeyUp,
    updatePlayerMovement,
    keyState
  };
};
