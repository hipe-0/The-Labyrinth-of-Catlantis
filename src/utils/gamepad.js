// src/utils/gamepad.js
//
// Standard Gamepad API mapping. Browsers expose Xbox/PlayStation controllers
// with the "standard" layout: left stick on axes 0/1, right stick on 2/3, and
// the primary face button (A / Cross) on button 0. Values are read raw here;
// the movement controller applies the dead zone together with the touch input.

const MAX_AXIS = 1;

const axisValue = (gamepad, index) => {
  const value = gamepad?.axes?.[index];

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(-MAX_AXIS, Math.min(MAX_AXIS, value));
};

const isUsableGamepad = (gamepad) =>
  Boolean(
    gamepad &&
      gamepad.connected !== false &&
      gamepad.axes &&
      gamepad.axes.length >= 2
  );

export const EMPTY_GAMEPAD_INPUT = Object.freeze({
  connected: false,
  move: Object.freeze({ x: 0, y: 0 }),
  look: Object.freeze({ x: 0, y: 0 }),
  jump: false,
});

// Read one standard controller. DOM Y grows downward, so both stick Y axes
// are inverted to match the touch sticks (+Y = up/forward).
export const readGamepadState = (gamepad) => {
  if (!isUsableGamepad(gamepad)) {
    return null;
  }

  return {
    connected: true,
    move: {
      x: axisValue(gamepad, 0),
      y: -axisValue(gamepad, 1),
    },
    look: {
      x: axisValue(gamepad, 2),
      y: -axisValue(gamepad, 3),
    },
    jumpPressed: Boolean(gamepad.buttons?.[0]?.pressed),
  };
};

// Prefer a controller that reports the standard mapping, but accept any
// connected pad with at least a left stick so single-stick pads still move.
export const findActiveGamepad = (gamepads) => {
  const connected = Array.from(gamepads || []).filter(isUsableGamepad);

  return (
    connected.find((gamepad) => gamepad.mapping === 'standard') ||
    connected[0] ||
    null
  );
};

const defaultGetGamepads = () => {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.getGamepads !== 'function'
  ) {
    return [];
  }

  try {
    return navigator.getGamepads();
  } catch {
    return [];
  }
};

// Polling tracker for the frame loop. It converts the held A/Cross button into
// a one-shot jump request. The first poll after connecting only records the
// button state, so plugging in with A held does not fire an accidental jump.
export const createGamepadTracker = (getGamepads = defaultGetGamepads) => {
  let jumpHeld = false;
  let wasConnected = false;

  return {
    poll() {
      const state = readGamepadState(findActiveGamepad(getGamepads()));

      if (!state) {
        jumpHeld = false;
        wasConnected = false;
        return EMPTY_GAMEPAD_INPUT;
      }

      const jump =
        state.jumpPressed && !jumpHeld && wasConnected;

      jumpHeld = state.jumpPressed;
      wasConnected = true;

      return {
        connected: true,
        move: state.move,
        look: state.look,
        jump,
      };
    },

    reset() {
      jumpHeld = false;
      wasConnected = false;
    },
  };
};
