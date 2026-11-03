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
  MOVE_SPEED: 0.05, // Halved walking speed; jump physics is unchanged
  MOVE_FIXED_STEP: 1 / 144, // Fixed simulation step; same speed on 60/144 Hz
  ROTATE_SMOOTHING: 15, // Exponential rotation smoothing rate (1/second)
  MOVE_STRIDE: 0.5,  // Distance per grid movement
  
  // Rotation Constants
  ROTATION_ANGLE: Math.PI / 4, // 45 degrees
  ROTATION_STEP_INTERVAL: 0.18, // Seconds per 45° step while held (~250°/s)
  ROTATION_THRESHOLD: 0.01, // Precision for rotation alignment
  
  // Jump Mechanics
  JUMP_VELOCITY: 4,    // Increased from 0.3 for stronger initial jump
  GRAVITY: 9.8,        // Increased from 0.5 for more realistic gravity
  
  // Collision and Movement
  GRID_REPEL: 0.2,  // Controls how far from grid lines the player is kept
  
  // Sky and lighting
  SKY: {
    STAR_COUNT: 1000,
    STAR_SIZE: 0.1,
    STAR_RADIUS: 50,
    ROTATION_SPEED: 0.025, // Matches the moon's orbit speed
    TILT_ANGLE: Math.PI / 4
  },
  MOON: {
    ORBIT_SPEED: 0.025, // Kept in sync with SKY.ROTATION_SPEED
    SPIN_SPEED: 0.01,
    POSITION: [30, 30, 30],
    // The moon dips toward the horizon during its tilted orbit. The shadow
    // light is kept at least this high so the floor always catches light and
    // wall shadows stay readable.
    MIN_LIGHT_HEIGHT: 30,
    SIZE: 5,
    INNER_SIZE: 4.8,
    SEGMENTS: 32,
    OUTER_COLOR: "#FFFFFF",
    INNER_COLOR: "#CCCCCC",
    OUTER_EMISSIVE: 0.5,
    INNER_EMISSIVE: 0.3
  }
};
