import { getMountainHeights } from './mountainHeight';

const points = Array.from({ length: 32 }, (_, index) => ({
  angle: (index / 32) * Math.PI * 2,
}));

describe('getMountainHeights', () => {
  test('centers on the base height, spans peak to valley, and clamps at ground', () => {
    const heights = getMountainHeights(points, {
      seed: 101,
      frequency: 5,
      baseHeight: 7,
      span: 20,
    });

    expect(heights).toHaveLength(points.length);
    expect(Math.min(...heights)).toBe(0);
    expect(Math.max(...heights)).toBeCloseTo(17, 5);

    for (const height of heights) {
      expect(height).toBeGreaterThanOrEqual(0);
    }
  });

  test('is deterministic for the same seed', () => {
    const options = {
      seed: 202,
      frequency: 5,
      baseHeight: 9.5,
      span: 26,
    };

    expect(getMountainHeights(points, options)).toEqual(
      getMountainHeights(points, options)
    );
  });
});
