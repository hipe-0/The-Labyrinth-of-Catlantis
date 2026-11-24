import {
  EMPTY_GAMEPAD_INPUT,
  createGamepadTracker,
  findActiveGamepad,
  readGamepadState,
} from './gamepad';

const createButton = (pressed) => ({ pressed, value: pressed ? 1 : 0 });

const createGamepad = ({
  axes = [0, 0, 0, 0],
  buttons = [],
  connected = true,
  mapping = 'standard',
} = {}) => ({
  axes,
  buttons,
  connected,
  mapping,
});

describe('readGamepadState', () => {
  it('maps standard axes to movement and look with +Y pointing up', () => {
    const gamepad = createGamepad({
      axes: [0.5, -0.25, -0.75, 1],
      buttons: [createButton(true)],
    });

    const state = readGamepadState(gamepad);

    expect(state.move.x).toBeCloseTo(0.5, 6);
    expect(state.move.y).toBeCloseTo(0.25, 6);
    expect(state.look.x).toBeCloseTo(-0.75, 6);
    expect(state.look.y).toBeCloseTo(-1, 6);
    expect(state.jumpPressed).toBe(true);
  });

  it('rejects disconnected or stick-less pads', () => {
    expect(readGamepadState(null)).toBeNull();
    expect(readGamepadState(createGamepad({ connected: false }))).toBeNull();
    expect(readGamepadState(createGamepad({ axes: [0] }))).toBeNull();
  });

  it('clamps out-of-range axis values', () => {
    const state = readGamepadState(
      createGamepad({ axes: [4, -3, 2, -2] })
    );

    expect(state.move.x).toBe(1);
    expect(state.move.y).toBe(1);
    expect(state.look.x).toBe(1);
    expect(state.look.y).toBe(1);
  });
});

describe('findActiveGamepad', () => {
  it('prefers a standard-mapped pad and skips disconnected ones', () => {
    const disconnected = createGamepad({ connected: false });
    const nonStandard = createGamepad({ mapping: '' });
    const standard = createGamepad({ mapping: 'standard' });

    expect(
      findActiveGamepad([disconnected, nonStandard, standard])
    ).toBe(standard);
    expect(findActiveGamepad([null, disconnected])).toBeNull();
  });
});

describe('createGamepadTracker', () => {
  it('returns empty input when no pad is connected', () => {
    const tracker = createGamepadTracker(() => []);

    expect(tracker.poll()).toBe(EMPTY_GAMEPAD_INPUT);
  });

  it('turns a held A/Cross button into one jump request', () => {
    const buttons = [createButton(false)];
    const tracker = createGamepadTracker(() => [
      createGamepad({ buttons }),
    ]);

    expect(tracker.poll().jump).toBe(false);

    buttons[0] = createButton(true);
    expect(tracker.poll().jump).toBe(true);
    expect(tracker.poll().jump).toBe(false);

    buttons[0] = createButton(false);
    expect(tracker.poll().jump).toBe(false);

    buttons[0] = createButton(true);
    expect(tracker.poll().jump).toBe(true);
  });

  it('does not jump when the pad first appears with A held', () => {
    const tracker = createGamepadTracker(() => [
      createGamepad({ buttons: [createButton(true)] }),
    ]);

    expect(tracker.poll().jump).toBe(false);
    expect(tracker.poll().jump).toBe(false);
  });

  it('forwards stick values and resets jump state on disconnect', () => {
    const buttons = [createButton(true)];
    let pads = [createGamepad({ axes: [0, -1, 1, 0], buttons })];
    const tracker = createGamepadTracker(() => pads);

    tracker.poll();
    const state = tracker.poll();

    expect(state.connected).toBe(true);
    expect(state.move.y).toBeCloseTo(1, 6);
    expect(state.look.x).toBeCloseTo(1, 6);

    pads = [];
    expect(tracker.poll()).toBe(EMPTY_GAMEPAD_INPUT);

    pads = [createGamepad({ buttons })];
    expect(tracker.poll().jump).toBe(false);
  });
});
