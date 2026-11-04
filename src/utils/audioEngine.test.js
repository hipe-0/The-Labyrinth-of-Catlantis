import { createAudioEngine } from './audioEngine';

describe('audioEngine', () => {
  it('is a silent no-op when Web Audio is unavailable', () => {
    const engine = createAudioEngine();

    expect(() => {
      engine.start();
      engine.meow();
      engine.levelComplete();
      engine.update(
        {
          moving: true,
          speed: 3.6,
          x: 1,
          z: 1,
          rotation: 0,
          exitX: 29,
          exitY: 29,
        },
        1 / 60
      );
      engine.dispose();
    }).not.toThrow();
  });
});
