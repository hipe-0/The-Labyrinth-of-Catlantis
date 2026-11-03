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

  // World floor (centred on the maze, large enough to hold the horizon rings)
  FLOOR_SIZE: 180,

  // Movement Parameters
  MOVE_SPEED: 0.05, // Halved walking speed; jump physics is unchanged
  MOVE_FIXED_STEP: 1 / 144, // Fixed simulation step; same speed on 60/144 Hz
  ROTATE_SMOOTHING: 15, // Exponential rotation smoothing rate (1/second)
  MOVE_STRIDE: 0.5,  // Distance per grid movement
  
  // Rotation Constants
  ROTATION_ANGLE: Math.PI / 4, // 45 degrees
  ROTATION_STEP_INTERVAL: 0.18, // Derives the continuous hold speed (45°/0.18 s ≈ 250°/s)
  ROTATION_THRESHOLD: 0.01, // Precision for rotation alignment
  
  // Jump Mechanics
  JUMP_VELOCITY: 4,    // Increased from 0.3 for stronger initial jump
  GRAVITY: 9.8,        // Increased from 0.5 for more realistic gravity
  
  // Collision and Movement
  GRID_REPEL: 0.2,  // Controls how far from grid lines the player is kept
  
  // Shadows
  SHADOW: {
    ZONE_HALF_SIZE: 10, // 20x20 world-unit shadowed area around the player
    MAP_SIZE: 2048,
    IDLE_UPDATE_INTERVAL: 0.2, // Seconds between refreshes while standing still
    MOVE_THRESHOLD: 0.01, // Minimum movement before refreshing while walking
  },

  // Decorative mountain rings around the maze. They are pushed well outside
  // the maze and kept low so there is still a visible horizon/sky above them.
  HORIZON: {
    RINGS: [
      { RADIUS: 40, HEIGHT: 7, SEED: 101, LINE_OPACITY: 0.55 },
      { RADIUS: 55, HEIGHT: 9.5, SEED: 202, LINE_OPACITY: 0.8 },
      { RADIUS: 70, HEIGHT: 12, SEED: 303, LINE_OPACITY: 1.0 },
    ],
    INITIAL_POINTS: 10,
    INITIAL_JITTER: 2.5,
    PASSES: 3,
    AMPLITUDE: 1.5,
    ROUGHNESS: 0.55,
    TOP_BAND_HEIGHT: 0.22,
  },

  // Sky and lighting
  SKY: {
    STAR_COUNT: 1000,
    STAR_SIZE: 0.4,
    STAR_RADIUS: 200, // Kept well outside the horizon rings and the moon
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
