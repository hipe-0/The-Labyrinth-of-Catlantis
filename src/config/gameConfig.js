// src/config/gameConfig.js
export const CAT_COLORS = {
  'white': { body: '#FFFFFF', ears: '#F0F0F0', eyes: '#000000' },
  'black': { body: '#333333', ears: '#1A1A1A', eyes: '#FFFFFF' },
  'gray': { body: '#808080', ears: '#696969', eyes: '#FFFFFF' },
  'mix': { body: '#A0522D', ears: '#8B4513', eyes: '#000000' }
};

export const GAME_CONFIG = {
  MAZE_WIDTH: 31,
  MAZE_HEIGHT: 31,
  MOVE_SPEED: 0.1,
  ROTATE_SPEED: 0.1,
  JUMP_VELOCITY: 4,
  GRAVITY: 9.8
};
