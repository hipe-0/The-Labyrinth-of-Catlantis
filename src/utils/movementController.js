// src/utils/movementController.js
import { GAME_CONFIG } from '../config/gameConfig';

export const createMovementController = (
  maze, 
  playerRef, 
  setCollectedCats, 
  setSkyColor, 
  cats
) => {
  const { MOVE_SPEED, ROTATE_SPEED } = GAME_CONFIG;
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
    return Math.round(rotation / (Math.PI / 4)) * (Math.PI / 4);
  };

  const handleKeyDown = (event) => {
    switch(event.key) {
      case 'ArrowUp':
        keyState.ArrowUp = true;
        break;
      case 'ArrowDown':
        keyState.ArrowDown = true;
        break;
      case 'ArrowLeft':
        keyState.ArrowLeft = true;
        break;
      case 'ArrowRight':
        keyState.ArrowRight = true;
        break;
      case ' ':
        const player = playerRef.current;
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
    // Jump physics with gravity
    if (player.isJumping) {
      player.jumpVelocity -= GAME_CONFIG.GRAVITY * delta;
      player.jumpHeight += player.jumpVelocity * delta;

      if (player.jumpHeight <= 0) {
        player.jumpHeight = 0;
        player.jumpVelocity = 0;
        player.isJumping = false;
      }
    }

    // Forward movement
    if (keyState.ArrowUp) {
      const newX = player.x - Math.sin(player.rotation);
      const newZ = player.y - Math.cos(player.rotation);
      
      if (checkCollision(newX, newZ)) {
        player.targetX = Math.round(newX * 2) / 2;
        player.targetY = Math.round(newZ * 2) / 2;

        const catIndex = cats.findIndex(cat => 
          Math.round(cat.x) === Math.round(player.targetX) && 
          Math.round(cat.y) === Math.round(player.targetY)
        );
        
        if (catIndex !== -1) {
          const newCollectedCats = new Set(player.collectedCats);
          if (!newCollectedCats.has(catIndex)) {
            newCollectedCats.add(catIndex);
            player.collectedCats = newCollectedCats;
            setCollectedCats(newCollectedCats);

            const lightenPercentage = (newCollectedCats.size / 6) * 40;
            const newSkyColor = `hsl(240, ${100 - lightenPercentage}%, ${50 + lightenPercentage/2}%)`;
            setSkyColor(newSkyColor);
          }
        }
      }
    }

    // Backward movement
    if (keyState.ArrowDown) {
      const newX = player.x + Math.sin(player.rotation);
      const newZ = player.y + Math.cos(player.rotation);
      
      if (checkCollision(newX, newZ)) {
        player.targetX = Math.round(newX * 2) / 2;
        player.targetY = Math.round(newZ * 2) / 2;
      }
    }

    // Rotate left (counterclockwise)
    if (keyState.ArrowLeft) {
      player.targetRotation = normalizeRotation(player.rotation + Math.PI / 4);
    }

    // Rotate right (clockwise)
    if (keyState.ArrowRight) {
      player.targetRotation = normalizeRotation(player.rotation - Math.PI / 4);
    }

    // Smooth position interpolation (grid-aligned)
    player.x += (player.targetX - player.x) * MOVE_SPEED;
    player.y += (player.targetY - player.y) * MOVE_SPEED;

    // Precise position alignment
    const threshold = 0.01;
    if (Math.abs(player.x - player.targetX) < threshold) {
      player.x = player.targetX;
    }
    if (Math.abs(player.y - player.targetY) < threshold) {
      player.y = player.targetY;
    }

    // Smooth rotation interpolation
    player.rotation += (player.targetRotation - player.rotation) * ROTATE_SPEED;

    // Precise rotation alignment
    if (Math.abs(player.rotation - player.targetRotation) < 0.01) {
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
