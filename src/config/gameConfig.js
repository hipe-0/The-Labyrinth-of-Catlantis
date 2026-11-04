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
  MOVE_FIXED_STEP: 1 / 144, // Fixed simulation step; same speed on 60/144 Hz
  ROTATE_SMOOTHING: 15, // Exponential rotation smoothing rate (1/second)
  
  // Rotation Constants
  ROTATION_ANGLE: Math.PI / 4, // 45 degrees
  ROTATION_STEP_INTERVAL: 0.18, // Derives the continuous hold speed (45°/0.18 s ≈ 250°/s)
  ROTATION_THRESHOLD: 0.01, // Precision for rotation alignment
  
  // Jump Mechanics
  JUMP_VELOCITY: 4,    // Increased from 0.3 for stronger initial jump
  GRAVITY: 9.8,        // Increased from 0.5 for more realistic gravity

  // Player collision and interaction. The player is a 2D circle on the floor,
  // not a grid point: it bumps into walls and slides along them.
  PLAYER: {
    RADIUS: 0.2, // World units; corridors are 1 unit wide
    WALK_SPEED: 3.6, // World units/second (matches the previous slowed feel)
    CAT_PICKUP_RADIUS: 0.55, // Centre-to-centre distance for collecting a cat
    EXIT_REACH_RADIUS: 0.5, // Centre-to-centre distance for reaching the exit
  },

  // The camera follows the collision circle with a small, clamped delay so wall
  // sliding stays smooth without letting the camera enter a wall.
  CAMERA: {
    FOLLOW_SMOOTHING: 20, // Exponential follow rate (1/second)
    MAX_LAG: 0.12, // Maximum distance between camera and player centre
  },

  // Procedural audio levels
  AUDIO: {
    MASTER_VOLUME: 0.45,
    WIND_MAX_VOLUME: 0.075,
    FOOTSTEP_VOLUME: 0.09,
    BEACON_INTERVAL: 2.4, // Seconds between beacon pings
  },
  
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
    TILT_ANGLE: Math.PI / 4,
    DOME_RADIUS: 400,
    GLOW_STRENGTH: 0.45,
    GLOW_POWER: 24,
    TRANSITION_SPEED: 3,
    // Index 0 is the initial night sky. Each collected cat moves to the next
    // palette: blue, green, purple, yellow, rose, teal. The halo is centred on
    // the moon; the night halo is deliberately faint.
    GRADIENTS: [
      { name: 'Night', top: '#000000', mid1: '#000000', mid2: '#000006', horizon: '#050812', glow: '#c9d6ff', glowStrength: 0.3 },
      { name: 'Blue', top: '#050a24', mid1: '#0d2a5c', mid2: '#2f6fa8', horizon: '#9fd3e6', glow: '#ffd7a8', glowStrength: 0.45 },
      { name: 'Green', top: '#02120c', mid1: '#0a4029', mid2: '#2f8f5b', horizon: '#a8d98a', glow: '#ffe6a3', glowStrength: 0.45 },
      { name: 'Purple', top: '#14001f', mid1: '#3b1259', mid2: '#7b3fa0', horizon: '#c77fd1', glow: '#ffc2d4', glowStrength: 0.45 },
      { name: 'Yellow', top: '#1f1000', mid1: '#6b3a00', mid2: '#c97a00', horizon: '#ffc247', glow: '#fff0b0', glowStrength: 0.5 },
      { name: 'Rose', top: '#1a020e', mid1: '#5c1235', mid2: '#b03a5b', horizon: '#f28a8a', glow: '#ffe0c2', glowStrength: 0.45 },
      { name: 'Teal', top: '#001414', mid1: '#064a4a', mid2: '#1e8c8c', horizon: '#8fd6c9', glow: '#f5e6b8', glowStrength: 0.45 },
    ],
  },
  MOON: {
    ORBIT_SPEED: 0.025, // Kept in sync with SKY.ROTATION_SPEED
    SPIN_SPEED: 0.01,
    // Kept well outside the 70-unit horizon ring so the mountains occlude the
    // moon when it is low. The size is scaled to preserve its apparent size.
    POSITION: [90, 90, 90],
    // The moon dips toward the horizon during its tilted orbit. The shadow
    // light is kept at least this high so the floor always catches light and
    // wall shadows stay readable.
    MIN_LIGHT_HEIGHT: 30,
    SIZE: 15,
    INNER_SIZE: 14.4,
    SEGMENTS: 32,
    OUTER_COLOR: "#FFFFFF",
    INNER_COLOR: "#CCCCCC",
    OUTER_EMISSIVE: 0.5,
    INNER_EMISSIVE: 0.3
  }
};
