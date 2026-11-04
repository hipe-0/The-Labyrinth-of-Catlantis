// src/utils/audioEngine.js
//
// Small procedural sound engine. Everything is synthesised with the Web Audio
// API, so the game needs no audio assets and stays offline-friendly.
//
// The context is created from the Start button/keypress (a user gesture), which
// satisfies browser autoplay policies. In environments without Web Audio the
// engine is a silent no-op.

import { GAME_CONFIG } from '../config/gameConfig';

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
const SILENCE = 0.0001;

const createNoiseBuffer = (context, seconds = 2) => {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let smoothed = 0;

  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    smoothed = smoothed * 0.94 + white * 0.06;
    data[index] = smoothed * 4;
  }

  return buffer;
};

export function createAudioEngine() {
  const { AUDIO } = GAME_CONFIG;

  let context = null;
  let master = null;
  let noiseBuffer = null;
  let windGain = null;
  let unavailable = false;
  let started = false;
  let stepTimer = 0;
  let stepPan = 0.15;
  let beaconTimer = 1.2;

  const ensureContext = () => {
    if (context) {
      return context;
    }

    if (unavailable || typeof window === 'undefined') {
      return null;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      unavailable = true;
      return null;
    }

    try {
      context = new AudioContextClass();
    } catch {
      unavailable = true;
      context = null;
      return null;
    }

    master = context.createGain();
    master.gain.value = AUDIO.MASTER_VOLUME;
    master.connect(context.destination);
    noiseBuffer = createNoiseBuffer(context);

    // Continuous filtered noise; its gain follows the player's actual speed.
    const windSource = context.createBufferSource();
    const windFilter = context.createBiquadFilter();

    windSource.buffer = noiseBuffer;
    windSource.loop = true;
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 460;
    windFilter.Q.value = 0.55;
    windGain = context.createGain();
    windGain.gain.value = 0;

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    windSource.start();

    return context;
  };

  const connectOutput = (node, pan = 0) => {
    if (!context.createStereoPanner || Math.abs(pan) < 0.001) {
      node.connect(master);
      return;
    }

    const panner = context.createStereoPanner();
    panner.pan.value = clamp(pan, -1, 1);
    node.connect(panner);
    panner.connect(master);
  };

  const playTone = ({
    frequency,
    endFrequency = frequency,
    type = 'sine',
    duration = 0.2,
    volume = 0.12,
    when = 0,
    pan = 0,
    attack = 0.01,
  }) => {
    const audioContext = ensureContext();

    if (!audioContext) {
      return;
    }

    const startAt = audioContext.currentTime + when;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(frequency, 1), startAt);

    if (endFrequency !== frequency) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(endFrequency, 1),
        startAt + duration
      );
    }

    gain.gain.setValueAtTime(SILENCE, startAt);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(volume, SILENCE),
      startAt + Math.min(attack, duration * 0.5)
    );
    gain.gain.exponentialRampToValueAtTime(SILENCE, startAt + duration);

    oscillator.connect(gain);
    connectOutput(gain, pan);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.03);
  };

  const footstep = () => {
    const audioContext = ensureContext();

    if (!audioContext || !started) {
      return;
    }

    const startAt = audioContext.currentTime;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    source.buffer = noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.value = 650 + Math.random() * 550;
    filter.Q.value = 0.7;

    gain.gain.setValueAtTime(SILENCE, startAt);
    gain.gain.exponentialRampToValueAtTime(
      AUDIO.FOOTSTEP_VOLUME * (0.8 + Math.random() * 0.4),
      startAt + 0.008
    );
    gain.gain.exponentialRampToValueAtTime(SILENCE, startAt + 0.12);

    source.connect(filter);
    filter.connect(gain);
    connectOutput(gain, stepPan);
    source.start(startAt, Math.random() * 1.5, 0.14);
    source.stop(startAt + 0.15);

    // A quiet low thump gives the step a little body.
    playTone({
      frequency: 82,
      endFrequency: 52,
      type: 'sine',
      duration: 0.09,
      volume: AUDIO.FOOTSTEP_VOLUME * 0.35,
      pan: stepPan,
    });

    stepPan = -stepPan;
  };

  const beaconPing = (pan, proximity) => {
    const volume = 0.018 + 0.1 * proximity * proximity;

    playTone({
      frequency: 880,
      endFrequency: 660,
      type: 'sine',
      duration: 0.55,
      volume,
      pan,
      attack: 0.02,
    });
    playTone({
      frequency: 1320,
      endFrequency: 990,
      type: 'sine',
      duration: 0.45,
      volume: volume * 0.35,
      pan,
      when: 0.03,
    });
  };

  const start = () => {
    const audioContext = ensureContext();

    if (!audioContext) {
      started = true;
      return;
    }

    started = true;

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    // Rising three-note welcome chime.
    playTone({ frequency: 523.25, type: 'triangle', duration: 0.2, volume: 0.14 });
    playTone({
      frequency: 659.25,
      type: 'triangle',
      duration: 0.24,
      volume: 0.12,
      when: 0.1,
    });
    playTone({
      frequency: 783.99,
      type: 'triangle',
      duration: 0.42,
      volume: 0.12,
      when: 0.2,
    });
  };

  const meow = () => {
    const audioContext = ensureContext();

    if (!audioContext || !started) {
      return;
    }

    const startAt = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const formant = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(430, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(760, startAt + 0.12);
    oscillator.frequency.exponentialRampToValueAtTime(620, startAt + 0.26);
    oscillator.frequency.exponentialRampToValueAtTime(330, startAt + 0.52);

    formant.type = 'bandpass';
    formant.frequency.value = 980;
    formant.Q.value = 2.4;

    gain.gain.setValueAtTime(SILENCE, startAt);
    gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.035);
    gain.gain.setValueAtTime(0.18, startAt + 0.14);
    gain.gain.exponentialRampToValueAtTime(SILENCE, startAt + 0.55);

    oscillator.connect(formant);
    formant.connect(gain);
    gain.connect(master);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.58);
  };

  const levelComplete = () => {
    const audioContext = ensureContext();

    if (!audioContext || !started) {
      return;
    }

    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((frequency, index) => {
      playTone({
        frequency,
        type: 'triangle',
        duration: 0.34,
        volume: 0.12,
        when: index * 0.11,
      });
    });
  };

  const update = (state = {}, delta = 0) => {
    if (!started) {
      return;
    }

    const audioContext = ensureContext();

    if (!audioContext) {
      return;
    }

    const speed = Math.max(0, state.speed || 0);
    const moving = Boolean(state.moving) && speed > 0.05;
    const now = audioContext.currentTime;

    if (windGain) {
      const windTarget = moving
        ? Math.min(AUDIO.WIND_MAX_VOLUME, 0.025 + speed * 0.012)
        : 0;

      windGain.gain.setTargetAtTime(windTarget, now, 0.12);
    }

    if (moving) {
      const stepInterval = clamp(1.1 / Math.max(speed, 0.5), 0.26, 0.6);
      stepTimer += Math.min(delta, 0.1);

      while (stepTimer >= stepInterval) {
        stepTimer -= stepInterval;
        footstep();
      }
    } else {
      stepTimer = Math.min(stepTimer, 0.2);
    }

    if (Number.isFinite(state.exitX) && Number.isFinite(state.exitY)) {
      beaconTimer -= Math.min(delta, 0.1);

      if (beaconTimer <= 0) {
        const dx = state.exitX - (state.x || 0);
        const dz = state.exitY - (state.z || 0);
        const distance = Math.hypot(dx, dz);
        const right =
          dx * Math.cos(state.rotation || 0) -
          dz * Math.sin(state.rotation || 0);
        const pan = distance > 0.001 ? clamp(right / distance, -1, 1) : 0;
        const proximity = clamp(1 - distance / 55, 0, 1);

        beaconPing(pan, proximity);
        beaconTimer = AUDIO.BEACON_INTERVAL;
      }
    }
  };

  const dispose = () => {
    started = false;

    if (context) {
      context.close().catch(() => {});
    }

    context = null;
    master = null;
    noiseBuffer = null;
    windGain = null;
  };

  return {
    start,
    meow,
    levelComplete,
    update,
    dispose,
  };
}
