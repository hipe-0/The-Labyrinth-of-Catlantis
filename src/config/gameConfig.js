// src/config/gameConfig.js
export const CAT_COLORS = {
  'white': { body: '#FFFFFF', ears: '#F0F0F0', eyes: '#000000' },
  'black': { body: '#333333', ears: '#1A1A1A', eyes: '#FFFFFF' },
  'gray': { body: '#808080', ears: '#696969', eyes: '#FFFFFF' },
  'mix': { body: '#A0522D', ears: '#8B4513', eyes: '#000000' }
};

export const GAME_CONFIG = {
  // Maze Dimensions
  MAZE_WIDTH: 31,
  MAZE_HEIGHT: 31,

  // Movement Parameters
  MOVE_SPEED: 0.1,
  ROTATE_SPEED: 0.1,
  MOVE_STRIDE: 0.5, // Distance per grid movement
  
  // Rotation Constants
  ROTATION_ANGLE: Math.PI / 4, // 45 degrees
  ROTATION_THRESHOLD: 0.01, // Precision for rotation alignment
  
  // Jump Mechanics
  JUMP_VELOCITY: 4,
  GRAVITY: 9.8,
  
  // Collision and Movement
  POSITION_THRESHOLD: 0.01, // Precision for position alignment
  GRID_PRECISION: 2 // Number of decimal places for grid alignment
};
