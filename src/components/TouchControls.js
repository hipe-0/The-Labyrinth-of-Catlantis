import React, { useEffect, useRef } from 'react';
import { getStickVector } from '../utils/joystick';

const STICK_SIZE = 'clamp(104px, min(28vw, 24vh), 148px)';
const KNOB_SIZE = 'clamp(46px, min(13vw, 12vh), 64px)';
const JUMP_SIZE = 'clamp(58px, min(16vw, 14vh), 76px)';

const safeBottom = 'max(16px, env(safe-area-inset-bottom, 0px))';
const safeLeft = 'max(16px, env(safe-area-inset-left, 0px))';
const safeRight = 'max(16px, env(safe-area-inset-right, 0px))';

const baseStyle = {
  position: 'relative',
  width: STICK_SIZE,
  height: STICK_SIZE,
  borderRadius: '50%',
  border: '2px solid rgba(255, 255, 255, 0.35)',
  background:
    'radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04) 70%)',
  boxShadow: 'inset 0 0 18px rgba(255, 255, 255, 0.08)',
  boxSizing: 'border-box',
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  pointerEvents: 'auto',
};

const knobStyle = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  width: KNOB_SIZE,
  height: KNOB_SIZE,
  borderRadius: '50%',
  border: '2px solid rgba(255, 255, 255, 0.85)',
  background: 'rgba(255, 255, 255, 0.32)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
};

// One fixed analog stick. Each stick owns exactly one pointer, so the left
// thumb can move while the right thumb looks (and vice versa).
function Stick({ label, onChange, testId }) {
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const pointerIdRef = useRef(null);
  const originRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const resetStickRef = useRef(null);

  onChangeRef.current = onChange;

  const resetStick = () => {
    pointerIdRef.current = null;
    originRef.current = null;

    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }

    onChangeRef.current({ x: 0, y: 0 });
  };

  resetStickRef.current = resetStick;

  // Fallback for browsers where pointer capture is unavailable: a release
  // anywhere on the page still centers the stick instead of leaving it stuck.
  useEffect(() => {
    const handleWindowPointerEnd = (event) => {
      if (
        pointerIdRef.current === null ||
        event.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      resetStickRef.current();
    };

    window.addEventListener('pointerup', handleWindowPointerEnd);
    window.addEventListener('pointercancel', handleWindowPointerEnd);

    return () => {
      window.removeEventListener('pointerup', handleWindowPointerEnd);
      window.removeEventListener('pointercancel', handleWindowPointerEnd);
    };
  }, []);

  // Geometry is measured once per gesture. The knob visually follows the
  // thumb, while the analog value is always relative to the press point.
  const getStickMetrics = () => {
    const base = baseRef.current;

    if (!base) {
      return null;
    }

    const rect = base.getBoundingClientRect();
    const radius = rect.width / 2;
    // Keep the whole knob inside the base, not just its centre.
    const knobRadius = rect.width * 0.22;

    return {
      centerX: rect.left + radius,
      centerY: rect.top + radius,
      maxOffset: Math.max(radius - knobRadius, 1),
    };
  };

  const positionKnob = (clientX, clientY, metrics) => {
    if (!knobRef.current || !metrics) {
      return;
    }

    const dx = clientX - metrics.centerX;
    const dy = clientY - metrics.centerY;
    const distance = Math.hypot(dx, dy);
    const scale =
      distance > metrics.maxOffset ? metrics.maxOffset / distance : 1;

    knobRef.current.style.transform =
      `translate(-50%, -50%) translate(${dx * scale}px, ${dy * scale}px)`;
  };

  const updateFromPointer = (event) => {
    const origin = originRef.current;

    if (!origin) {
      return;
    }

    const metrics = getStickMetrics();

    if (!metrics) {
      return;
    }

    positionKnob(event.clientX, event.clientY, metrics);

    // Pressing establishes a fresh origin, so the vector is measured from the
    // thumb's landing point rather than the fixed centre of the pad.
    const vector = getStickVector(
      event.clientX,
      event.clientY,
      origin.x,
      origin.y,
      metrics.maxOffset
    );

    onChangeRef.current({ x: vector.x, y: vector.y });
  };

  const handlePointerDown = (event) => {
    if (pointerIdRef.current !== null) {
      return;
    }

    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    originRef.current = { x: event.clientX, y: event.clientY };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; pointerup still releases the stick.
    }

    // Show the origin under the thumb without producing input yet.
    positionKnob(event.clientX, event.clientY, getStickMetrics());
    onChangeRef.current({ x: 0, y: 0 });
  };

  const handlePointerMove = (event) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateFromPointer(event);
  };

  const handlePointerEnd = (event) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    resetStick();
  };

  return (
    <div
      ref={baseRef}
      role="group"
      aria-label={label}
      data-testid={testId}
      style={baseStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div ref={knobRef} style={knobStyle} />
    </div>
  );
}

export function TouchControls({ onMove, onLook, onJump }) {
  const containerStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  };

  const jumpButtonStyle = {
    position: 'absolute',
    right: safeRight,
    bottom: `calc(${safeBottom} + ${STICK_SIZE} + 14px)`,
    width: JUMP_SIZE,
    height: JUMP_SIZE,
    padding: 0,
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(230, 0, 115, 0.55)',
    color: 'white',
    fontSize: 'clamp(12px, min(3.4vw, 3.2vh), 16px)',
    fontWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: 1,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(4px)',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    cursor: 'pointer',
    pointerEvents: 'auto',
  };

  return (
    <div style={containerStyle}>
      <div
        style={{
          position: 'absolute',
          left: safeLeft,
          bottom: safeBottom,
          pointerEvents: 'auto',
        }}
      >
        <Stick
          label="Movement stick"
          testId="move-stick"
          onChange={onMove}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          right: safeRight,
          bottom: safeBottom,
          pointerEvents: 'auto',
        }}
      >
        <Stick
          label="Look stick"
          testId="look-stick"
          onChange={onLook}
        />
      </div>

      <button
        type="button"
        aria-label="Jump"
        style={jumpButtonStyle}
        onPointerDown={(event) => {
          event.preventDefault();
          onJump();
        }}
        onContextMenu={(event) => event.preventDefault()}
      >
        Jump
      </button>
    </div>
  );
}
