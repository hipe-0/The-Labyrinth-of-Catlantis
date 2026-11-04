import React, { useRef } from 'react';

export function TouchControls({ onMove, onJump }) {
  // Track one direction per active finger so releasing one button does not
  // cancel a direction that is still being held with another finger.
  const activePointers = useRef(new Map());

  const updateDirection = () => {
    const directions = Array.from(activePointers.current.values());
    onMove(directions.length ? directions[directions.length - 1] : 'stop');
  };

  const startMove = (direction) => (event) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; pointerup/leave still stop movement.
    }
    activePointers.current.set(event.pointerId, direction);
    updateDirection();
  };

  const endMove = (event) => {
    if (!activePointers.current.has(event.pointerId)) {
      return;
    }
    activePointers.current.delete(event.pointerId);
    updateDirection();
  };

  const buttonSize = 'clamp(56px, min(20vw, 13vh), 84px)';
  const jumpSize = 'clamp(60px, min(21vw, 13vh), 88px)';
  const gap = 'clamp(6px, 2vw, 12px)';

  const buttonStyle = {
    width: buttonSize,
    height: buttonSize,
    padding: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    border: '2px solid rgba(255, 255, 255, 0.9)',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 'clamp(24px, min(8vw, 7vh), 34px)',
    lineHeight: 1,
    color: 'white',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'none',
    pointerEvents: 'auto',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
  };

  const containerStyle = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
    paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
    boxSizing: 'border-box',
    zIndex: 1000,
    pointerEvents: 'none',
  };

  // One row of three: forward in the middle, turn buttons on either side. The
  // old two-row layout included backward, which was rarely useful on mobile.
  const arrowContainerStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(3, ${buttonSize})`,
    gridTemplateRows: buttonSize,
    gap,
    pointerEvents: 'none',
  };

  const jumpButtonStyle = {
    ...buttonStyle,
    width: jumpSize,
    height: jumpSize,
    backgroundColor: 'rgba(230, 0, 115, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    fontSize: 'clamp(14px, min(4.2vw, 3.8vh), 18px)',
    fontWeight: 700,
    letterSpacing: '0.02em',
    marginLeft: gap,
  };

  const arrowButton = (direction, label, symbol, gridColumn, gridRow) => (
    <button
      type="button"
      aria-label={label}
      style={{ ...buttonStyle, gridColumn, gridRow }}
      onPointerDown={startMove(direction)}
      onPointerUp={endMove}
      onPointerCancel={endMove}
      onPointerLeave={endMove}
      onLostPointerCapture={endMove}
      onContextMenu={(event) => event.preventDefault()}
    >
      {symbol}
    </button>
  );

  return (
    <div style={containerStyle}>
      <div style={arrowContainerStyle}>
        {arrowButton('left', 'Turn left', '←', '1', '1')}
        {arrowButton('forward', 'Move forward', '↑', '2', '1')}
        {arrowButton('right', 'Turn right', '→', '3', '1')}
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
