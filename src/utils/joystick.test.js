import { applyRadialDeadZone, getStickVector } from './joystick';

describe('applyRadialDeadZone', () => {
  it('returns zero inside the dead zone', () => {
    expect(applyRadialDeadZone(0.05, 0.05, 0.12)).toEqual({
      x: 0,
      y: 0,
      magnitude: 0,
    });
    expect(applyRadialDeadZone(0, 0, 0.12)).toEqual({
      x: 0,
      y: 0,
      magnitude: 0,
    });
  });

  it('rescales the first movement outside the dead zone', () => {
    const result = applyRadialDeadZone(0.56, 0, 0.12);

    expect(result.x).toBeCloseTo(0.5, 6);
    expect(result.y).toBeCloseTo(0, 6);
    expect(result.magnitude).toBeCloseTo(0.5, 6);
  });

  it('clamps oversized input to the unit circle and keeps direction', () => {
    const result = applyRadialDeadZone(3, 4, 0.12);

    expect(Math.hypot(result.x, result.y)).toBeCloseTo(1, 6);
    expect(result.x).toBeCloseTo(0.6, 6);
    expect(result.y).toBeCloseTo(0.8, 6);
  });

  it('preserves the direction for diagonal input', () => {
    const result = applyRadialDeadZone(0.5, 0.5, 0.12);

    expect(result.x).toBeCloseTo(result.y, 8);
    expect(result.x).toBeGreaterThan(0);
  });
});

describe('getStickVector', () => {
  it('returns zero at the centre', () => {
    const result = getStickVector(50, 50, 50, 50, 40);

    expect(result).toMatchObject({ offsetX: 0, offsetY: 0, x: 0, y: 0 });
  });

  it('points up with positive Y when the thumb moves up', () => {
    const result = getStickVector(50, 30, 50, 50, 40);

    expect(result.offsetY).toBeCloseTo(-20, 6);
    expect(result.y).toBeCloseTo(0.5, 6);
    expect(result.x).toBeCloseTo(0, 6);
  });

  it('clamps the knob to the stick radius', () => {
    const result = getStickVector(200, 50, 50, 50, 40);

    expect(result.offsetX).toBeCloseTo(40, 6);
    expect(result.x).toBeCloseTo(1, 6);
    expect(result.magnitude).toBeCloseTo(1, 6);
  });
});
