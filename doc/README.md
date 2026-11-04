# The Labyrinth of Catlantis — Code Documentation

A first-person 3D maze game. You wake up in a dark labyrinth, collect six lost cats,
and try to reach the glowing exit. Every cat you find brightens the sky.

This folder is a map of the codebase: what each file does, how the game works, how to
run it, and which parts are currently unfinished or broken.

---

## At a glance

| Item | Value |
| --- | --- |
| Project name | `maze-three-project` |
| Live demo | <https://hipe-0.github.io/The-Labyrinth-of-Catlantis/> |
| Latest work | 2026-11-04 — circle collision, procedural audio, level fly-up/splash |
| Current branch | `Touch-control` — local branch |
| Main stack | React 19, Create React App 5, Three.js 0.174, React Three Fiber 9 |
| Entry point | `src/index.js` → `src/App.js` → `src/MazeScene.js` |
| Maze size | 31 × 31 cells |
| Cats per level | 6 |
| Controls | Arrow keys to move/turn, Space to jump; touch D-pad + Jump |

> The remaining feature requests are tracked in [TODO.md](TODO.md). Low-priority
> engine notes are in [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

---

## Is it development-ready?

**The toolchain is ready; the repository and current code are not.**

| Area | Status | Evidence |
| --- | --- | --- |
| Local toolchain | Ready | Node 24.18 / npm 11.16 installed, dependencies resolve, `npm start` compiles and serves HTTP 200, `npm run build` succeeds |
| Git working tree | Ready | Work is committed on `Touch-control`; branch still needs an upstream/push |
| Game code | Playable, needs device testing | Touch input, timing, cats/exit, lighting, shadows, horizon, sky, circle collision, procedural audio, and the level fly-up/splash are implemented; remaining feature work is in [TODO.md](TODO.md) |
| Tests / CI | Partial | Jest tests for start keys, spawn orientation, fractal rings, rotation, circle collision/sliding, cat pickup, and the audio fallback; no CI workflow or license |
| Published site | Stale | `gh-pages` and the live site predate the recent work |

See [RUNNING.md](RUNNING.md#git-remote-status-verified-2026-11-02) for the verified
remote/branch table.

Before treating the folder as a clean hand-off:

1. Test the touch fixes on a real phone (movement, turning, jump, bottom controls).
2. Push `Touch-control` with an upstream.
3. Add a CI workflow and finish the remaining [TODO.md](TODO.md) items.
4. Rebuild and redeploy `gh-pages` after the fixes.

---

## Tech stack

| Package | Version | Role |
| --- | --- | --- |
| `react`, `react-dom` | ^19.0.0 | UI and component model |
| `@react-three/fiber` | ^9.1.0 | React renderer for Three.js; gives us `<Canvas>`, `useFrame`, `useThree` |
| `three` | ^0.174.0 | 3D engine (meshes, lights, cameras, geometries) |
| `react-scripts` | 5.0.1 | Create React App toolchain (dev server, build, test) |
| `gh-pages` | ^6.3.0 | Publishes the production build to GitHub Pages |

The game deliberately uses very few abstractions: plain React state, a mutable
`playerRef` for per-frame data, and a hand-written movement controller.

---

## Quick start

Double-click **`Start Game.bat`** in the project root.

Or from a terminal:

```bat
cd "C:\Users\mouni\Desktop\2026-03-26 Maze game - The-Labyrinth-of-Catlantis"
npm start
```

The dev server opens the game automatically. Because `package.json` sets a GitHub
Pages `homepage`, CRA serves the app under
<http://localhost:3000/The-Labyrinth-of-Catlantis/> and prints the exact URL. See
[RUNNING.md](RUNNING.md) for build, test, deploy, and troubleshooting details.

---

## How to play

| Input | Action |
| --- | --- |
| ↑ | Walk forward along the current facing |
| ← / → | Turn 45° left / right |
| Space | Jump |
| Touch controls | ← / ↑ / → D-pad + Jump button after the first touch |

Goal: collect all 6 cats, then reach the exit beacon in the far corner. Each collected
cat meows and rockets into the sky while the gradient sky palette shifts smoothly
(blue, green, purple, yellow, rose, teal). Reaching the exit with all 6 cats starts a
slow camera fly-up over the maze; a splash screen then announces the next labyrinth,
and Start generates a brand-new maze.

---

## Repository layout

```text
The-Labyrinth-of-Catlantis/
├── Start Game.bat          # Windows launcher (dev server)
├── package.json            # dependencies, scripts, GitHub Pages homepage
├── package-lock.json       # locked dependency tree
├── README.md               # short original readme + doc link
├── deploy.sh               # alternative bash deploy script (force-push gh-pages)
├── .gitignore              # ignores node_modules, build, coverage
│
├── doc/                    # this documentation set
│   ├── README.md           # overview, stack, layout, quick start
│   ├── ARCHITECTURE.md     # runtime flow, algorithms, coordinate system
│   ├── FILES.md            # file-by-file reference
│   ├── RUNNING.md          # install, build, deploy, troubleshooting
│   ├── TODO.md             # feature backlog and completion status
│   ├── mockups/            # horizon and sky visual proposals
│   └── KNOWN_ISSUES.md     # bugs and rough edges in the current tree
│
├── public/                 # static files copied as-is by CRA
│   ├── index.html          # HTML shell (<div id="root">)
│   ├── manifest.json       # PWA metadata
│   ├── favicon.ico
│   ├── logo192.png
│   ├── logo512.png
│   ├── robots.txt
│   └── 404.html            # GitHub Pages SPA fallback
│
├── src/
│   ├── index.js            # React root; mounts <App />
│   ├── App.js              # start screen ↔ canvas switch, touch state
│   ├── MazeScene.js        # the game: state, frame loop, scene graph
│   ├── index.css           # full-screen mobile reset; no scroll/white band
│   ├── setupTests.js       # jest-dom setup; smoke tests
│   │
│   ├── config/
│   │   └── gameConfig.js   # all tunable constants + cat palettes
│   │
│   ├── utils/
│   │   ├── audioEngine.js        # procedural start/step/wind/beacon/meow sounds
│   │   ├── collision.js         # circle-vs-AABB collision + wall sliding
│   │   ├── fractal.js           # fractal mountain-ring generator
│   │   ├── mazeGeneration.js    # edge-wall maze carving, rooms, cat placement
│   │   ├── mazeWalls.js         # unique/merged wall segments for render + collision
│   │   ├── movementController.js# keyboard, collision, rotation, jump
│   │   ├── rocket.js            # collected-cat fly-up curve
│   │   └── takeoff.js           # level-complete fly-up camera math
│   │
│   └── components/
│       ├── StartScreen.js  # title screen and Start button
│       ├── TouchControls.js# on-screen D-pad + Jump button
│       ├── CuteCat.js      # low-poly cat built from primitives
│       ├── RocketCat.js    # collected-cat launch animation
│       ├── ExitBeacon.js   # green cube + vertical light beam
│       ├── Floor.js        # ground plane; receives/casts shadows
│       ├── HorizonMountains.js # three decorative fractal rings
│       ├── Moon.js         # two-sphere emissive moon on a tilted orbit
│       ├── SkyGradient.js  # shader sky + moon-centred halo
│       └── StarField.js    # 1000-point star sphere
│
├── build/                  # generated production build (git-ignored)
└── node_modules/           # installed dependencies (git-ignored)
```

---

## Where to look for…

| Question | File |
| --- | --- |
| How is the maze generated? | `src/utils/mazeGeneration.js` |
| How does movement/collision work? | `src/utils/movementController.js`, `src/utils/collision.js` |
| How does the level fly-up work? | `src/utils/takeoff.js`, `src/MazeScene.js`, `src/App.js` |
| How do sounds work? | `src/utils/audioEngine.js` |
| How is the scene assembled? | `src/MazeScene.js` |
| How do I tune speed, jump, sky, moon? | `src/config/gameConfig.js` |
| How does the start screen work? | `src/App.js`, `src/components/StartScreen.js` |
| How are cats drawn? | `src/components/CuteCat.js` |
| How is the app built/deployed? | `package.json`, `deploy.sh`, [RUNNING.md](RUNNING.md) |
| What is next? | [TODO.md](TODO.md) |
| What is currently broken? | [KNOWN_ISSUES.md](KNOWN_ISSUES.md) |

---

## Documentation index

1. [ARCHITECTURE.md](ARCHITECTURE.md) — runtime flow, state, maze algorithm, movement
   math, coordinate system, rendering.
2. [FILES.md](FILES.md) — file-by-file reference with exports and responsibilities.
3. [RUNNING.md](RUNNING.md) — install, launcher, scripts, build, deploy, troubleshooting.
4. [TODO.md](TODO.md) — completed features and the remaining backlog.
5. [KNOWN_ISSUES.md](KNOWN_ISSUES.md) — bugs, regressions, and rough edges found in the
   current working tree, with suggested fixes.
