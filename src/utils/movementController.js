// src/utils/movementController.js
import { GAME_CONFIG } from '../config/gameConfig';
import { createMazeCollisionWorld, moveCircle } from './collision';
import { applyRadialDeadZone } from './joystick';

const TWO_PI = Math.PI * 2;
const MAX_MOVEMENT_SUBSTEPS = 15;

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

// Keep yaw bounded so very long sessions do not lose floating-point precision.
const wrapAngle = (angle) => {
  if (!Number.isFinite(angle)) {
    return 0;
  }

  return ((((angle + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
};

const toFinite = (value) => (Number.isFinite(value) ? value : 0);

export const createMovementController = (
  maze,
  playerRef,
  setCollectedCats,
  setSkyIndex,
  cats,
  onCatCollected
) => {
  const { MOVE_FIXED_STEP, PLAYER, INPUT } = GAME_CONFIG;

  const collisionWorld = createMazeCollisionWorld(maze);

  // Keyboard state is held in our own structure so the browser's repetition
  // behaviour cannot change the movement speed.
  const keyState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  // Raw touch-stick values, normalized to [-1, 1]. +Y points up/forward.
  const stickMove = { x: 0, y: 0 };
  const stickLook = { x: 0, y: 0 };

  // Standard gamepad axes, also raw. Keeping them separate lets keyboard,
  // touch, and a physical controller contribute at the same time.
  const gamepadMove = { x: 0, y: 0 };
  const gamepadLook = { x: 0, y: 0 };

  // Pointer-locked mouse movement is accumulated between frames.
  let pendingYaw = 0;
  let pendingPitch = 0;

  const tryJump = () => {
    const player = playerRef.current;

    if (!player || player.isJumping) {
      return;
    }

    player.isJumping = true;
    player.jumpVelocity = GAME_CONFIG.JUMP_VELOCITY;
    player.jumpHeight = 0;
  };

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keyState.forward = true;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        keyState.backward = true;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keyState.left = true;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        keyState.right = true;
        break;
      case ' ':
      case 'Spacebar':
        if (!event.repeat) {
          tryJump();
        }
        break;
      default:
        break;
    }
  };

  const handleKeyUp = (event) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keyState.forward = false;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        keyState.backward = false;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keyState.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        keyState.right = false;
        break;
      default:
        break;
    }
  };

  // Pointer-lock reports relative movement in pixels. Convert once, then let
  // the frame update apply the accumulated delta at a stable point.
  const handleMouseMove = (movementX = 0, movementY = 0) => {
    pendingYaw -= toFinite(movementX) * INPUT.MOUSE_SENSITIVITY;
    pendingPitch -= toFinite(movementY) * INPUT.MOUSE_SENSITIVITY;
  };

  const setMoveInput = (x = 0, y = 0) => {
    stickMove.x = clamp(toFinite(x), -1, 1);
    stickMove.y = clamp(toFinite(y), -1, 1);
  };

  const setLookInput = (x = 0, y = 0) => {
    stickLook.x = clamp(toFinite(x), -1, 1);
    stickLook.y = clamp(toFinite(y), -1, 1);
  };

  const setGamepadInput = (
    moveX = 0,
    moveY = 0,
    lookX = 0,
    lookY = 0
  ) => {
    gamepadMove.x = clamp(toFinite(moveX), -1, 1);
    gamepadMove.y = clamp(toFinite(moveY), -1, 1);
    gamepadLook.x = clamp(toFinite(lookX), -1, 1);
    gamepadLook.y = clamp(toFinite(lookY), -1, 1);
  };

  const resetInput = () => {
    keyState.forward = false;
    keyState.backward = false;
    keyState.left = false;
    keyState.right = false;
    stickMove.x = 0;
    stickMove.y = 0;
    stickLook.x = 0;
    stickLook.y = 0;
    gamepadMove.x = 0;
    gamepadMove.y = 0;
    gamepadLook.x = 0;
    gamepadLook.y = 0;
    pendingYaw = 0;
    pendingPitch = 0;
    playerRef.current.movementAccumulator = 0;
  };

  const applyLook = (player, frameDelta) => {
    const analogLook = applyRadialDeadZone(
      stickLook.x,
      stickLook.y,
      INPUT.STICK_DEAD_ZONE
    );
    const padLook = applyRadialDeadZone(
      gamepadLook.x,
      gamepadLook.y,
      INPUT.GAMEPAD_DEAD_ZONE
    );
    // Physical controllers use a faster rate than the touch sticks.
    const yawRate =
      analogLook.x * INPUT.LOOK_STICK_YAW_RATE +
      padLook.x * INPUT.GAMEPAD_LOOK_YAW_RATE;
    const pitchRate =
      analogLook.y * INPUT.LOOK_STICK_PITCH_RATE +
      padLook.y * INPUT.GAMEPAD_LOOK_PITCH_RATE;

    player.rotation = wrapAngle(
      player.rotation + pendingYaw - yawRate * frameDelta
    );

    const pitch = toFinite(player.pitch) + pendingPitch;
    player.pitch = clamp(
      pitch + pitchRate * frameDelta,
      -INPUT.PITCH_LIMIT,
      INPUT.PITCH_LIMIT
    );

    pendingYaw = 0;
    pendingPitch = 0;
  };

  // Combine keyboard, left touch stick, and left gamepad stick into a
  // camera-relative vector. The result never exceeds unit length so diagonals
  // are not faster.
  const resolveMoveInput = () => {
    const analogMove = applyRadialDeadZone(
      stickMove.x,
      stickMove.y,
      INPUT.STICK_DEAD_ZONE
    );
    const padMove = applyRadialDeadZone(
      gamepadMove.x,
      gamepadMove.y,
      INPUT.GAMEPAD_DEAD_ZONE
    );

    let x =
      (keyState.right ? 1 : 0) -
      (keyState.left ? 1 : 0) +
      analogMove.x +
      padMove.x;
    let y =
      (keyState.forward ? 1 : 0) -
      (keyState.backward ? 1 : 0) +
      analogMove.y +
      padMove.y;

    const magnitude = Math.hypot(x, y);

    if (magnitude > 1) {
      x /= magnitude;
      y /= magnitude;
    }

    return { x, y };
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

  const movePlayer = (player, input) => {
    const inputMagnitude = Math.hypot(input.x, input.y);

    if (inputMagnitude < 1e-8) {
      return;
    }

    const distance = PLAYER.WALK_SPEED * MOVE_FIXED_STEP * inputMagnitude;
    const sin = Math.sin(player.rotation);
    const cos = Math.cos(player.rotation);

    // Forward is (-sin, -cos); right is (cos, -sin).
    const directionX = (-sin * input.y + cos * input.x) / inputMagnitude;
    const directionZ = (-cos * input.y - sin * input.x) / inputMagnitude;
    const dx = directionX * distance;
    const dz = directionZ * distance;
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
    // Clamp very long frames (tab switches, stalls) so physics and look do
    // not jump by a large amount at once.
    const frameDelta = Math.min(delta, 0.1);

    if (typeof player.pitch !== 'number') {
      player.pitch = 0;
    }

    applyLook(player, frameDelta);

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

    const moveInput = resolveMoveInput();

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
      movePlayer(player, moveInput);
      player.movementAccumulator -= MOVE_FIXED_STEP;
      movementSteps += 1;
    }
  };

  return {
    handleKeyDown,
    handleKeyUp,
    handleMouseMove,
    setMoveInput,
    setLookInput,
    setGamepadInput,
    requestJump: tryJump,
    resetInput,
    updatePlayerMovement,
    keyState,
  };
};
