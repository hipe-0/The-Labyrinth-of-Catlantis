import React, { useEffect } from 'react';

export function StartScreen({
  onStart,
  title = 'The Labyrinth of Catlantis',
  subtitle = 'Find all the lost cats in the mysterious maze',
  buttonLabel = 'Start Game',
  hint = 'Press Enter or Space to start',
  controlsHint = 'Use Arrow Keys to Navigate | Space to Jump',
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      zIndex: 20,
      padding: '24px',
      boxSizing: 'border-box',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      <h1 style={{
        fontSize: 'clamp(2rem, 8vw, 3rem)',
        lineHeight: 1.15,
        margin: '0 0 20px',
        textShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073'
      }}>
        {title}
      </h1>
      <p style={{
        fontSize: 'clamp(1rem, 4vw, 1.2rem)',
        margin: '0 0 30px',
        maxWidth: '600px'
      }}>
        {subtitle}
      </p>
      <button
        onClick={onStart}
        style={{
          padding: 'clamp(12px, 3vw, 15px) clamp(24px, 6vw, 30px)',
          fontSize: 'clamp(1rem, 4vw, 1.2rem)',
          backgroundColor: '#e60073',
          border: 'none',
          borderRadius: '5px',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 0 10px #e60073'
        }}
        onMouseOver={e => e.target.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.target.style.transform = 'scale(1)'}
      >
        {buttonLabel}
      </button>
      <p style={{
        marginTop: '20px',
        marginBottom: 0,
        fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
        opacity: 0.8
      }}>
        {hint}
        {controlsHint ? (
          <>
            <br />
            {controlsHint}
          </>
        ) : null}
      </p>
    </div>
  );
}
