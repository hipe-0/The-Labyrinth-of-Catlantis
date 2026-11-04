import { getCatRocketPose } from './rocket';

const poseAt = (elapsed) =>
  getCatRocketPose({
    elapsed,
    delay: 0.25,
    duration: 2.4,
    height: 50,
    spinSpeed: 5,
    endScale: 0.1,
  });

describe('cat rocket', () => {
  it('waits during the crouch, then starts at full size', () => {
    expect(poseAt(0).y).toBe(0);
    expect(poseAt(0).scale).toBe(1);
    expect(poseAt(0.2).y).toBe(0);
    expect(poseAt(0.25).y).toBe(0);
  });

  it('accelerates upward and shrinks by the end', () => {
    const halfway = poseAt(0.25 + (2.4 - 0.25) / 2);
    const end = poseAt(2.4);

    expect(halfway.y).toBeCloseTo(12.5);
    expect(halfway.scale).toBeCloseTo(0.775);
    expect(end.y).toBe(50);
    expect(end.scale).toBeCloseTo(0.1);
    expect(end.spin).toBeCloseTo(5 * (2.4 - 0.25));
  });

  it('clamps overshoot', () => {
    const pose = poseAt(5);

    expect(pose.progress).toBe(1);
    expect(pose.y).toBe(50);
  });
});
