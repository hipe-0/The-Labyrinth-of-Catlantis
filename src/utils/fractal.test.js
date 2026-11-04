import { generateFractalRing } from './fractal';

describe('generateFractalRing', () => {
  it('is deterministic for a given seed', () => {
    const first = generateFractalRing({ radius: 26, seed: 101 });
    const second = generateFractalRing({ radius: 26, seed: 101 });

    expect(first).toEqual(second);
  });

  it('adds one point per segment for each pass', () => {
    const points = generateFractalRing({
      radius: 26,
      seed: 101,
      initialPoints: 10,
      passes: 3,
    });

    expect(points).toHaveLength(10 * 2 ** 3);
  });

  it('keeps the radius near the requested value', () => {
    const points = generateFractalRing({ radius: 36, seed: 202 });
    const maxDeviation = 2.5 + 1.5 + 1.5 * 0.55 + 1.5 * 0.55 ** 2;

    points.forEach((point) => {
      expect(Math.abs(point.radius - 36)).toBeLessThanOrEqual(maxDeviation + 1e-9);
    });
  });

  it('produces different outlines for different seeds', () => {
    const first = generateFractalRing({ radius: 36, seed: 202 });
    const second = generateFractalRing({ radius: 36, seed: 303 });

    expect(first[0].radius).not.toBe(second[0].radius);
  });
});
