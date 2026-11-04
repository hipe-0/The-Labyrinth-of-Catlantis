import {
  getTakeoffPose,
  shortestAngle,
  smoothStep,
} from './takeoff';

const poseAt = (elapsed) =>
  getTakeoffPose({
    fromX: 29,
    fromZ: 29,
    fromYaw: 0,
    elapsed,
    duration: 4,
    mazeCenter: 15,
    height: 30,
    pitch: -0.9,
    startHeight: 0.5,
  });

describe('takeoff camera', () => {
  it('clamps and eases the progress value', () => {
    expect(smoothStep(-1)).toBe(0);
    expect(smoothStep(0)).toBe(0);
    expect(smoothStep(0.5)).toBeCloseTo(0.5);
    expect(smoothStep(1)).toBe(1);
    expect(smoothStep(2)).toBe(1);
  });

  it('starts at eye height looking forward', () => {
    const pose = poseAt(0);

    expect(pose.y).toBeCloseTo(0.5);
    expect(pose.pitch).toBeCloseTo(0);
    expect(pose.yaw).toBeCloseTo(0);
  });

  it('ends above the exit looking down at the maze centre', () => {
    const pose = poseAt(4);

    expect(pose.y).toBeCloseTo(30.5);
    expect(pose.pitch).toBeCloseTo(-0.9);
    // From (29,29), the centre (15,15) is north-west: yaw = PI / 4.
    expect(pose.yaw).toBeCloseTo(Math.PI / 4);
    expect(pose.x).toBe(29);
    expect(pose.z).toBe(29);
  });

  it('wraps the yaw the short way around', () => {
    expect(shortestAngle(Math.PI * 1.9, 0)).toBeCloseTo(Math.PI * 0.1);
    expect(shortestAngle(-Math.PI * 1.9, 0)).toBeCloseTo(-Math.PI * 0.1);
  });
});
