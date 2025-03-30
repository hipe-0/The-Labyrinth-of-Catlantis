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
  MOVE_STRIDE: 0.5,  // Distance per grid movement
  
  // Rotation Constants
  ROTATION_ANGLE: Math.PI / 4, // 45 degrees
  ROTATION_THRESHOLD: 0.01, // Precision for rotation alignment
  
  // Jump Mechanics
  JUMP_VELOCITY: 4,    // Increased from 0.3 for stronger initial jump
  GRAVITY: 9.8,        // Increased from 0.5 for more realistic gravity
  
  // Collision and Movement
  POSITION_THRESHOLD: 0.01, // Precision for position alignment
  GRID_PRECISION: 2, // Number of decimal places for grid alignment
  GRID_REPEL: 0.2,  // Controls how far from grid lines the player is kept
  
  // Sky and lighting
  SKY: {
    STAR_COUNT: 1000,
    STAR_SIZE: 0.1,
    STAR_RADIUS: 50,
    ROTATION_SPEED: 0.05,
    TILT_ANGLE: Math.PI / 4
  },
  MOON: {
    ORBIT_SPEED: 0.05,
    SPIN_SPEED: 0.02,
    POSITION: [30, 30, 30],
    SIZE: 5,
    INNER_SIZE: 4.8,
    SEGMENTS: 32,
    OUTER_COLOR: "#FFFFFF",
    INNER_COLOR: "#CCCCCC",
    OUTER_EMISSIVE: 0.5,
    INNER_EMISSIVE: 0.3
  }
};
