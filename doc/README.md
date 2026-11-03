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
| Last commit | `258f564` — 2025-04-01 |
| Current branch | `Touch-control` — **local only, not on GitHub** |
| Remote branches | `main` (`258f564`), `gh-pages` (`1f41a2c`) — no `Touch-control` |
| Uncommitted work | `src/App.js`, `src/MazeScene.js` modified; `src/components/TouchControls.js`, `doc/`, `Start Game.bat` new |
| Main stack | React 19, Create React App 5, Three.js 0.174, React Three Fiber 9 |
| Entry point | `src/index.js` → `src/App.js` → `src/MazeScene.js` |
| Maze size | 31 × 31 cells |
| Cats per level | 6 |
| Controls | Arrow keys to move/turn, Space to jump |

> The touch-control work is still uncommitted on a local branch. The regressions it
> introduced were fixed on 2026-11-02; see [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for the
> current status and the remaining low-priority items.

---

## Is it development-ready?

**The toolchain is ready; the repository and current code are not.**

| Area | Status | Evidence |
| --- | --- | --- |
| Local toolchain | Ready | Node 24.18 / npm 11.16 installed, dependencies resolve, `npm start` compiles and serves HTTP 200, `npm run build` succeeds |
| Git working tree | Not ready | `Touch-control` is local-only; 3 modified files + untracked touch controls/docs/launcher |
| Branch state | Not ready | Remote has only `main` and `gh-pages`; local `main` is 1 commit ahead with `32fb27f "shading trial, not working"` |
| Game code | Playable, needs device testing | Touch movement, movement/rotation timing, jump, wall jitter, cat/exit/win, lighting, floor shadows, and spawn view were fixed on 2026-11-02; the shadow-rendering regression was fixed on 2026-11-03; low-priority items remain in [KNOWN_ISSUES.md](KNOWN_ISSUES.md) |
| Tests / CI | Partial | Jest smoke tests for Enter/Space start and spawn orientation; no CI workflow, no license, no `.nvmrc`/`engines` |
| Published site | Stale | `gh-pages` and the live site are from 2025-04-01, still titled "React App" |

See [RUNNING.md](RUNNING.md#git-remote-status-verified-2026-11-02) for the verified
remote/branch table.

Before treating the folder as a clean hand-off:

1. Test the touch fixes on a real phone (movement, turning, jump, bottom controls).
2. Commit the touch work on `Touch-control` and push it with an upstream.
3. Decide what to do with the unpushed `main` experiment (`32fb27f`); do not push it
   as-is.
4. Add at least one smoke test and a CI workflow.
5. Rebuild and redeploy `gh-pages` after the fixes.

---

## Tech stack

| Package | Version | Role |
| --- | --- | --- |
| `react`, `react-dom` | ^19.0.0 | UI and component model |
| `@react-three/fiber` | ^9.1.0 | React renderer for Three.js; gives us `<Canvas>`, `useFrame`, `useThree` |
| `three` | ^0.174.0 | 3D engine (meshes, lights, cameras, geometries) |
| `@react-three/drei` | ^10.0.5 | Installed but **not imported anywhere** |
| `react-scripts` | 5.0.1 | Create React App toolchain (dev server, build, test) |
| `gh-pages` | ^6.3.0 | Publishes the production build to GitHub Pages |
| `web-vitals` | ^2.1.4 | CRA performance reporting hook |

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
| ↑ / ↓ | Walk forward / backward along the current facing |
| ← / → | Turn 45° left / right |
| Space | Jump |
| Touch controls | Intended for mobile, currently not wired correctly |

Goal: collect all 6 cats, then step onto the exit beacon in the far corner.
Collecting cats changes the sky colour from black toward light blue. Reaching the exit
with all 6 cats generates a brand-new maze.

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
│   └── KNOWN_ISSUES.md     # bugs and rough edges in the current tree
│
├── public/                 # static files copied as-is by CRA
│   ├── index.html          # HTML shell (<div id="root">)
│   ├── manifest.json       # PWA metadata (still CRA defaults)
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
│   ├── App.css             # unused CRA leftover
│   ├── logo.svg            # unused CRA leftover
│   ├── reportWebVitals.js  # CRA performance hook
│   ├── setupTests.js       # jest-dom setup (no tests exist)
│   │
│   ├── config/
│   │   └── gameConfig.js   # all tunable constants + cat palettes
│   │
│   ├── utils/
│   │   ├── mazeGeneration.js    # maze carving, rooms, cat placement
│   │   └── movementController.js# keyboard, collision, rotation, jump
│   │
│   └── components/
│       ├── StartScreen.js  # title screen and Start button
│       ├── TouchControls.js# on-screen D-pad + Jump button
│       ├── CuteCat.js      # low-poly cat built from primitives
│       ├── ExitBeacon.js   # green cube + vertical light beam
│       ├── Floor.js        # ground plane; receives/casts shadows
│       ├── Moon.js         # two-sphere emissive moon on a tilted orbit
│       └── StarField.js    # 1000-point star sphere
│
├── build/                  # generated production build (git-ignored)
├── node/                   # empty stray folder, unused
└── node_modules/           # installed dependencies (git-ignored)
```

---

## Where to look for…

| Question | File |
| --- | --- |
| How is the maze generated? | `src/utils/mazeGeneration.js` |
| How does movement/collision work? | `src/utils/movementController.js` |
| How is the scene assembled? | `src/MazeScene.js` |
| How do I tune speed, jump, sky, moon? | `src/config/gameConfig.js` |
| How does the start screen work? | `src/App.js`, `src/components/StartScreen.js` |
| How are cats drawn? | `src/components/CuteCat.js` |
| How is the app built/deployed? | `package.json`, `deploy.sh`, [RUNNING.md](RUNNING.md) |
| What is currently broken? | [KNOWN_ISSUES.md](KNOWN_ISSUES.md) |

---

## Documentation index

1. [ARCHITECTURE.md](ARCHITECTURE.md) — runtime flow, state, maze algorithm, movement
   math, coordinate system, rendering.
2. [FILES.md](FILES.md) — file-by-file reference with exports and responsibilities.
3. [RUNNING.md](RUNNING.md) — install, launcher, scripts, build, deploy, troubleshooting.
4. [KNOWN_ISSUES.md](KNOWN_ISSUES.md) — bugs, regressions, and rough edges found in the
   current working tree, with suggested fixes.
