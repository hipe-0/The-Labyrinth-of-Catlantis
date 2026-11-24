import { fireEvent, render } from '@testing-library/react';
import { TouchControls } from './TouchControls';

// jsdom does not implement PointerEvent; React can still receive one if we
// provide the small subset used by the controls.
if (typeof window.PointerEvent === 'undefined') {
  class TestPointerEvent extends window.MouseEvent {
    constructor(type, params = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? 'mouse';
    }
  }

  window.PointerEvent = TestPointerEvent;
}

const STICK_RECT = {
  left: 0,
  top: 0,
  right: 120,
  bottom: 120,
  width: 120,
  height: 120,
  x: 0,
  y: 0,
  toJSON: () => {},
};

const renderControls = () => {
  const onMove = jest.fn();
  const onLook = jest.fn();
  const onJump = jest.fn();
  const view = render(
    <TouchControls onMove={onMove} onLook={onLook} onJump={onJump} />
  );
  const moveStick = view.getByTestId('move-stick');
  const lookStick = view.getByTestId('look-stick');

  moveStick.getBoundingClientRect = () => STICK_RECT;
  lookStick.getBoundingClientRect = () => STICK_RECT;

  return { ...view, onMove, onLook, onJump, moveStick, lookStick };
};

const press = (stick, clientX, clientY, pointerId = 1) => {
  fireEvent.pointerDown(stick, {
    pointerId,
    pointerType: 'touch',
    clientX,
    clientY,
  });
};

const drag = (stick, clientX, clientY, pointerId = 1) => {
  fireEvent.pointerMove(stick, {
    pointerId,
    pointerType: 'touch',
    clientX,
    clientY,
  });
};

const release = (stick, pointerId = 1) => {
  fireEvent.pointerUp(stick, {
    pointerId,
    pointerType: 'touch',
  });
};

describe('TouchControls gesture origin', () => {
  it('does not move on press, even away from the pad centre', () => {
    const { onMove, moveStick } = renderControls();

    press(moveStick, 30, 30);

    expect(onMove).toHaveBeenLastCalledWith({ x: 0, y: 0 });
  });

  it('measures movement from the press point, not the pad centre', () => {
    const { onMove, moveStick } = renderControls();

    press(moveStick, 30, 30);
    drag(moveStick, 30, 20);

    const latest = onMove.mock.calls[onMove.mock.calls.length - 1][0];

    expect(latest.x).toBeCloseTo(0, 6);
    expect(latest.y).toBeGreaterThan(0);
    expect(latest.y).toBeLessThan(0.4);
  });

  it('clamps a full drag to unit output', () => {
    const { onMove, moveStick } = renderControls();

    press(moveStick, 30, 30);
    drag(moveStick, 30, -60);

    const latest = onMove.mock.calls[onMove.mock.calls.length - 1][0];

    expect(latest.x).toBeCloseTo(0, 6);
    expect(latest.y).toBeCloseTo(1, 6);
  });

  it('stops on release and starts a fresh origin on the next press', () => {
    const { onMove, moveStick } = renderControls();

    press(moveStick, 20, 20);
    drag(moveStick, 20, 10);
    release(moveStick);

    expect(onMove).toHaveBeenLastCalledWith({ x: 0, y: 0 });

    press(moveStick, 80, 80, 2);
    drag(moveStick, 80, 70, 2);

    const latest = onMove.mock.calls[onMove.mock.calls.length - 1][0];

    expect(latest.y).toBeGreaterThan(0);
    expect(latest.y).toBeLessThan(0.4);
  });

  it('keeps left movement and right look independent', () => {
    const { onMove, onLook, moveStick, lookStick } = renderControls();

    press(moveStick, 30, 30, 1);
    drag(moveStick, 30, 20, 1);
    press(lookStick, 30, 30, 2);
    drag(lookStick, 40, 30, 2);

    const move = onMove.mock.calls[onMove.mock.calls.length - 1][0];
    const look = onLook.mock.calls[onLook.mock.calls.length - 1][0];

    expect(move.y).toBeGreaterThan(0);
    expect(look.x).toBeGreaterThan(0);
  });

  it('fires jump on pointer down', () => {
    const { onJump, getByRole } = renderControls();

    fireEvent.pointerDown(getByRole('button', { name: 'Jump' }), {
      pointerId: 9,
      pointerType: 'touch',
    });

    expect(onJump).toHaveBeenCalledTimes(1);
  });
});
