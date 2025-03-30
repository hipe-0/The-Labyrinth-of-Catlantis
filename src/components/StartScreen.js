import React from 'react';

export function StartScreen({ onStart }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      zIndex: 20,
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        fontSize: '3em',
        marginBottom: '20px',
        textShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073'
      }}>
        The Labyrinth of Catlantis
      </h1>
      <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>
        Find all the lost cats in the mysterious maze
      </p>
      <button 
        onClick={onStart}
        style={{
          padding: '15px 30px',
          fontSize: '1.2em',
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
        Start Game
      </button>
      <p style={{ 
        marginTop: '20px',
        fontSize: '0.9em',
        opacity: 0.8 
      }}>
        Use Arrow Keys to Navigate | Space to Jump
      </p>
    </div>
  );
} 