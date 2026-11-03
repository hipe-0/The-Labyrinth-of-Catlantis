// src/utils/movementController.js
import { GAME_CONFIG } from '../config/gameConfig';

export const createMovementController = (
  maze, 
  playerRef, 
  setCollectedCats, 
  setSkyColor, 
  cats
) => {
  const {
    MOVE_SPEED,
    MOVE_FIXED_STEP,
    ROTATE_SMOOTHING,
    ROTATION_ANGLE,
    ROTATION_STEP_INTERVAL,
    ROTATION_THRESHOLD,
    MOVE_STRIDE,
    GRID_REPEL
  } = GAME_CONFIG;

  const MAX_MOVEMENT_SUBSTEPS = 15;
  const ROTATION_SPEED = ROTATION_ANGLE / ROTATION_STEP_INTERVAL;

  const keyState = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
  };

  const checkCollision = (x, z) => {
    const gridX = Math.round(x);
    const gridZ = Math.round(z);

    return maze[Math.round(gridZ)] && 
           maze[Math.round(gridZ)][Math.round(gridX)] !== 1;
  };

  const normalizeRotation = (rotation) => {
    // Ensure rotation is always a multiple of 45 degrees (PI/4)
    return Math.round(rotation / ROTATION_ANGLE) * ROTATION_ANGLE;
  };

  const avoidGridLines = (value) => {
    const fractionalPart = value - Math.floor(value);
    const centerLine = 0.5;
    
    // If too close to center line (0.5), push away from it
    if (Math.abs(fractionalPart - centerLine) < GRID_REPEL) {
      // Push to the nearest safe zone
      return Math.floor(value) + (fractionalPart < centerLine ? 
        centerLine - GRID_REPEL : 
        centerLine + GRID_REPEL
      );
    }
    
    return value;
  };

  const handleKeyDown = (event) => {
    const player = playerRef.current;

    switch(event.key) {
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
    switch(event.key) {
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

  const updatePlayerMovement = (player, delta, cats, setCollectedCats, setSkyColor) => {
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

    const collectCatAt = (targetX, targetY) => {
      const catIndex = cats.findIndex(cat =>
        Math.round(cat.x) === Math.round(targetX) &&
        Math.round(cat.y) === Math.round(targetY)
      );

      if (catIndex === -1) {
        return;
      }

      const newCollectedCats = new Set(player.collectedCats);
      if (newCollectedCats.has(catIndex)) {
        return;
      }

      newCollectedCats.add(catIndex);
      player.collectedCats = newCollectedCats;
      setCollectedCats(newCollectedCats);

      const lightenPercentage = (newCollectedCats.size / cats.length) * 40;
      setSkyColor(
        `hsl(240, ${100 - lightenPercentage}%, ${50 + lightenPercentage / 2}%)`
      );
    };

    const updateMovementTarget = () => {
      let newTargetX = player.targetX;
      let newTargetY = player.targetY;
      let movementOccurred = false;

      // Forward movement
      if (keyState.ArrowUp) {
        const newX = player.x - Math.sin(player.rotation) * MOVE_STRIDE;
        const newZ = player.y - Math.cos(player.rotation) * MOVE_STRIDE;
        
        if (checkCollision(newX, newZ)) {
          newTargetX = avoidGridLines(newX);
          newTargetY = avoidGridLines(newZ);
          movementOccurred = true;
          collectCatAt(newTargetX, newTargetY);
        }
      }

      // Backward movement
      if (keyState.ArrowDown) {
        const newX = player.x + Math.sin(player.rotation) * MOVE_STRIDE;
        const newZ = player.y + Math.cos(player.rotation) * MOVE_STRIDE;

        if (checkCollision(newX, newZ)) {
          newTargetX = avoidGridLines(newX);
          newTargetY = avoidGridLines(newZ);
          movementOccurred = true;
          collectCatAt(newTargetX, newTargetY);
        }
      }

      if (movementOccurred) {
        player.targetX = newTargetX;
        player.targetY = newTargetY;
      }
    };
    
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
      updateMovementTarget();
      player.x += (player.targetX - player.x) * MOVE_SPEED;
      player.y += (player.targetY - player.y) * MOVE_SPEED;
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
