import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const isLab =
  process.env.NODE_ENV === 'development' &&
  new URLSearchParams(window.location.search).has('lab');

// The lab is dev-only and lazy-loaded so it never becomes part of the normal
// game experience (and is not fetched on the start screen).
const GraphicsLab = lazy(() => import('./lab/GraphicsLab'));

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {isLab ? (
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              background: '#07090d',
              color: '#8a93a5',
              fontFamily: 'monospace',
              fontSize: 12,
              letterSpacing: '0.16em',
            }}
          >
            LOADING VISUAL LAB…
          </div>
        }
      >
        <GraphicsLab />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
