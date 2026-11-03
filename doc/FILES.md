# File Reference

A file-by-file description of the repository. Paths are relative to the project root.

---

## Root

### `package.json`

Project manifest.

- **name**: `maze-three-project`
- **homepage**: `https://hipe-0.github.io/The-Labyrinth-of-Catlantis` — this makes CRA
  build asset URLs under `/The-Labyrinth-of-Catlantis/`.
- **dependencies**: React 19, React Three Fiber 9, Three.js 0.174, drei 10, testing
  library, web-vitals.
- **devDependencies**: `gh-pages` 6.3.
- **scripts**:

| Script | Command | Purpose |
| --- | --- | --- |
| `start` | `react-scripts start` | Dev server on port 3000 with hot reload |
| `build` | `react-scripts build` | Production bundle in `build/` |
| `test` | `react-scripts test` | Jest watch mode |
| `eject` | `react-scripts eject` | Irreversible CRA config ejection (do not run casually) |
| `predeploy` | `npm run build` | Runs automatically before `deploy` |
| `deploy` | `gh-pages --dotfiles --message "..." -d build` | Pushes `build/` to the `gh-pages` branch |

### `package-lock.json`

npm lockfile (lockfile version 3). Pins the full dependency tree. Do not edit by hand;
regenerate with `npm install` when dependencies change.

### `README.md`

Original 12-line readme: pitch, author (Hippolyte Mounier), code credit (Claude AI),
controls, live URL. This `doc/` folder is the detailed companion.

### `deploy.sh`

Bash alternative to `npm run deploy`:

1. `npm run build`
2. create `temp-deploy/`
3. copy `build/*` into it
4. `git init`, commit
5. force-push to `git@github.com:hipe-0/The-Labyrinth-of-Catlantis.git main:gh-pages`
6. remove `temp-deploy/`

Requires Bash, Git, an SSH key for GitHub, and a clean build. The `gh-pages` npm
package is the simpler cross-platform path.

### `.gitignore`

Ignores `/node_modules`, `/build`, `/coverage`, `.pnp`, local env files, and npm/yarn
debug logs. Note that `node/` is **not** ignored (it is just an empty folder).

### `Start Game.bat` (added with this documentation)

Windows launcher. Checks that Node.js is available, installs dependencies if
`node_modules/react-scripts` is missing, then runs `npm start`. See
[RUNNING.md](RUNNING.md#launcher).

### `node/`

Empty directory `node/maze-three-project/`. It is not referenced by the app, not
tracked by Git, and safe to delete. It looks like an accidental nested folder.

### `build/`

Generated production output from an earlier build. Git-ignored. Contains hashed JS/CSS
bundles, `index.html`, `asset-manifest.json`, and the public assets. Do not edit by
hand; regenerate with `npm run build`. The current folder is stale relative to the
working tree.

### `node_modules/`

Installed dependencies (~926 top-level packages). Git-ignored. Recreate with
`npm install`.

---

## `public/`

Files here are copied verbatim into the build (except `index.html`, which CRA
processes).

### `public/index.html`

CRA HTML shell:

- `<div id="root"></div>` mount point.
- Loads `%PUBLIC_URL%/favicon.ico` and `manifest.json`.
- Title is still `React App`; description is the CRA default.
- No custom fonts or scripts.

### `public/manifest.json`

PWA manifest. Still the CRA sample (`short_name: "React App"`,
`name: "Create React App Sample"`). Only affects installability/branding.

### `public/404.html`

GitHub Pages SPA redirect helper (from rafgraph/spa-github-pages). It rewrites a deep
URL to the repo base path so client-side routes work. This game has no router, so it is
mostly harmless boilerplate.

### `public/favicon.ico`, `public/logo192.png`, `public/logo512.png`

CRA default icons. Not game-specific.

### `public/robots.txt`

Standard CRA robots file. No crawl restrictions.

---

## `src/` — application

### `src/index.js`

React entry point.

- Imports global `index.css`.
- `ReactDOM.createRoot(document.getElementById('root'))`.
- Renders `<App />` inside `<React.StrictMode>`.
- Calls `reportWebVitals()` with no callback (no-op in practice).

### `src/App.js`

Top-level UI and mode switch.

- State: `isGameStarted`, `hasTouch`; refs: `touchDirectionRef`, `jumpRequestRef`.
- Renders `<StartScreen onStart={...}>` until the game starts.
- After start, renders a full-screen `<Canvas>` (75° FOV, near 0.1, far 1000, initial
  camera `[1, 0.5, 1]`, antialias, DPR capped at 1.5) containing `<MazeScene>`.
- Passes `touchDirectionRef` and `jumpRequestRef` down to `MazeScene`.
- Shows `<TouchControls>` once `hasTouch` is true.
- `handleTouchMove(direction)` writes the ref; `handleTouchJump()` increments the jump
  ref. Neither causes a 3D re-render.
- Wrapper is fixed to the viewport with `touchAction: 'none'`, `overscrollBehavior:
  'none'`, and overflow hidden to suppress scrolling and pull-to-refresh.

### `src/MazeScene.js`

The core of the game.

Responsibilities:

1. **Level state** — creates `mazeData` with `generateMaze()`, stores
   `collectedCats` and `skyColor`.
2. **Player ref** — mutable object with position, rotation, jump, and collected set.
   The initial rotation faces the first open neighbour of `(1,1)`.
3. **Controller** — `useMemo(() => createMovementController(...), [generatedMaze, cats])`.
4. **Input** — registers `keydown`/`keyup` on `document` while the game is started;
   reads `touchDirectionRef` and `jumpRequestRef` in `useFrame` and maps them to arrow
   keys / Space. Touch input does not re-render the 3D scene.
5. **Renderer setup** — `App.js` enables shadows on the `<Canvas>` before the first
   render (materials compile without shadow support if this happens later). `MazeScene`
   sets ACES tone mapping and sRGB output, and refreshes the static shadow map at 5 Hz
   while the moon moves and immediately on a new maze.
6. **Frame loop** — applies touch input, checks exit, updates movement, syncs camera.
7. **Scene graph** — background colour, moon-following directional light, Moon,
   StarField, Floor, ExitBeacon, cats, memoized walls.

Key constants used here: camera eye height `0.5`, directional light intensity `3`,
light target `(15, 0, 15)`, shadow map `2048`, wall random scale ranges, exit beacon
position.

Known quirks: wall scales are memoized per maze and stable; cats are wrapped in
positioned groups with their palette; `ExitBeacon` receives `exitX`/`exitY` correctly.
Remaining issues are tracked in [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

### `src/config/gameConfig.js`

Single source of tunable constants.

```js
CAT_COLORS = {
  white: { body, ears, eyes },
  black: { ... },
  gray:  { ... },
  mix:   { ... }   // brown tabby palette
}

GAME_CONFIG = {
  MAZE_WIDTH: 31,
  MAZE_HEIGHT: 31,
  MOVE_SPEED: 0.05,         // per-substep movement interpolation
  MOVE_FIXED_STEP: 1 / 144, // fixed movement simulation step (same speed on 60/144 Hz)
  ROTATE_SMOOTHING: 15,     // exponential rotation smoothing rate (1/second)
  MOVE_STRIDE: 0.5,         // world units per attempted step
  ROTATION_ANGLE: Math.PI / 4,
  ROTATION_STEP_INTERVAL: 0.18, // seconds per 45° step while held (~250°/s)
  ROTATION_THRESHOLD: 0.01,
  JUMP_VELOCITY: 4,
  GRAVITY: 9.8,
  POSITION_THRESHOLD: 0.01,
  GRID_PRECISION: 2,
  GRID_REPEL: 0.2,
  SKY: { STAR_COUNT, STAR_SIZE, STAR_RADIUS, ROTATION_SPEED, TILT_ANGLE },
  MOON: { ORBIT_SPEED, SPIN_SPEED, POSITION, MIN_LIGHT_HEIGHT, SIZE, INNER_SIZE,
          SEGMENTS, OUTER_COLOR, INNER_COLOR, OUTER_EMISSIVE, INNER_EMISSIVE }
}
```

`POSITION_THRESHOLD` and `GRID_PRECISION` are currently unused.

### `src/utils/mazeGeneration.js`

Pure maze generation. No React, no Three.js.

Exports:

| Export | Signature | Purpose |
| --- | --- | --- |
| `createEmptyMaze` | `(width, height) => number[][]` | Grid filled with `1` (walls) |
| `isValidMazeCoordinate` | `(maze, x, y) => boolean` | Bounds check |
| `placeCats` | `(maze) => {x, y, color}[]` | Up to 6 unique walkable cells with palettes |
| `generateMaze` | `() => {maze, exitX, exitY, cats}` | Full level |

Internal helpers:

- `carvePassages(maze, x, y)` — recursive backtracker, step 2.
- `createRooms(maze, numRooms)` — 3–5 random rectangular rooms.
- `clearRoomArea(maze, startX, startY, roomWidth, roomHeight)` — sets cells to `0`.

Cats are placed with `Math.random()`; the start cell `(1,1)` is excluded so a cat can
never spawn under the player. A level can theoretically have fewer than 6 cats if the
attempt limit is hit, but on a 31 × 31 maze with many floor cells this is effectively
impossible.

### `src/utils/movementController.js`

Factory that closes over the maze, player ref, setters, and cats.

Exports `createMovementController`. Returned object:

| Member | Purpose |
| --- | --- |
| `handleKeyDown(event)` | Arrow up/down set movement state; left/right start continuous rotation while held; space starts a jump |
| `handleKeyUp(event)` | Clears movement/rotation state |
| `updatePlayerMovement(player, delta, cats, setCollectedCats, setSkyColor)` | Jump physics, fixed-step movement, collision, cat pickup, continuous rotation, interpolation |
| `keyState` | Raw arrow-key booleans (exposed for debugging) |

Internal helpers:

- `checkCollision(x, z)` — rounds to grid, returns true if the cell is not `1`.
- `normalizeRotation(rotation)` — snap to 45° multiples.
- `avoidGridLines(value)` — repel from fractional `0.5` boundaries.

This file contains the movement model described in
[ARCHITECTURE.md](ARCHITECTURE.md#6-movement-model).

### `src/components/StartScreen.js`

Full-screen DOM overlay with:

- Title "The Labyrinth of Catlantis" (white text with pink glow).
- Subtitle "Find all the lost cats in the mysterious maze".
- Pink **Start Game** button with hover scale.
- Controls hint: "Use Arrow Keys to Navigate | Space to Jump".

Props: `onStart` callback. No Three.js.

### `src/components/TouchControls.js`

On-screen controls for mobile. Props: `onMove(direction)`, `onJump()`.

- Left: a 2-row, 3-column D-pad with ↑, ←, ↓, → buttons. Uses pointer events with
  per-finger tracking and pointer capture; `onMove('forward' | 'backward' | 'left' |
  'right')` on press and `onMove('stop')` when the last direction is released.
- Right: a pink **Jump** button firing `onJump` on pointer down.
- Fixed to the bottom with `env(safe-area-inset-bottom)` support, responsive
  `clamp()` button sizes, and z-index 1000.
- Buttons prevent default gestures and context menus.

`MazeScene` maps these directions to arrow keys, and `App` turns the jump press into a
`jumpRequest` counter.

### `src/components/CuteCat.js`

Low-poly cat built from primitives:

| Part | Geometry | Position |
| --- | --- | --- |
| Body | box `0.4 × 0.3 × 0.6` | `(0, 0.15, 0)` |
| Head | sphere radius 0.25 | `(0, 0.45, 0)` |
| Ears | cones `0.1 × 0.2` | `(±0.1, 0.65, 0)`, tilted |
| Eyes | spheres radius 0.05 | `(±0.1, 0.45, 0.2)` |

Props: `color` (palette key, default `'white'`). It returns a bare `<group>` and does
**not** forward `position` or `receiveShadow`, so callers must wrap it in a positioned
group. `MazeScene` does this and places cats at `[cat.x, 0, cat.y]` with
`color={cat.color}`.

### `src/components/ExitBeacon.js`

Props: `exitX`, `exitY` (numbers).

- `<group position={[exitX, 0.5, exitY]}>`
- Green cube `1 × 1 × 1` at the exit cell.
- White translucent cylinder `radius 0.05, height 200` above it, emissive.
- `useFrame` bobs the beam (`y = 1 + sin(t) * 0.5`) and tilts it on X/Z.

`MazeScene` passes `exitX` and `exitY` correctly; the beacon sits at the exit cell.

### `src/components/Floor.js`

One 100 × 100 plane, rotated flat (`-π/2` on X), at `y = -0.01`, dark gray
(`#2A2A2A`), standard material. It both receives and casts shadows. No props.

### `src/components/Moon.js`

Two nested emissive spheres:

- Outer: radius 5, white, emissive intensity 0.5.
- Inner: radius 4.8, light gray, emissive intensity 0.3.
- Wrapped in an orbit group tilted by `SKY.TILT_ANGLE` and rotated on Y over time.
- The moon itself spins on Y.
- Receives `lightRef`; every frame copies the moon's world position into the
  directional light so the moonlight follows the visible moon. The Y coordinate is
  clamped to `MOON.MIN_LIGHT_HEIGHT` so the light never drops to the horizon and leaves
  the floor unlit.

Reads all values from `GAME_CONFIG.MOON`.

### `src/components/StarField.js`

- Builds a `THREE.BufferGeometry` with `STAR_COUNT` (1000) random points on a sphere of
  radius `STAR_RADIUS` (50).
- Renders `<points>` with white `pointsMaterial`, size `0.1`, size attenuation.
- Rotates the field slowly; tilted by `TILT_ANGLE`.
- Geometry is memoized but never explicitly disposed.

---

## `src/` — leftovers and styling

### `src/index.css`

Full-screen mobile reset: `html`, `body`, and `#root` fill the viewport with a black
background and `overflow: hidden`; `body` is fixed to the viewport and disables
overscroll/touch gestures. This prevents landscape scrolling and white bands. Also
contains the system font stack and font smoothing.

### `src/App.css`

Unused CRA starter styles (`.App`, `.App-logo`, spin animation, etc.). Nothing imports
it.

### `src/logo.svg`

Unused CRA React logo. Nothing imports it.

### `src/reportWebVitals.js`

CRA performance helper. `index.js` calls it without a callback, so it does nothing.
Kept as boilerplate.

### `src/setupTests.js`

Imports `@testing-library/jest-dom` for Jest. There are no test files in the repo, so
`npm test` only starts watch mode and finds nothing.

---

## `doc/`

Documentation only; nothing here is imported by the app.

| File | Contents |
| --- | --- |
| `README.md` | Overview, stack, quick start, repository layout, doc index |
| `ARCHITECTURE.md` | Runtime flow, state ownership, maze algorithm, movement math, rendering, coordinates |
| `FILES.md` | This file-by-file reference |
| `RUNNING.md` | Requirements, launcher, scripts, build, deploy, troubleshooting |
| `KNOWN_ISSUES.md` | Current bugs/regressions with causes and suggested fixes |

---

## Dependency graph

```text
index.js
├── index.css
├── App.js
│   ├── components/StartScreen.js
│   ├── components/TouchControls.js
│   └── MazeScene.js
│       ├── utils/mazeGeneration.js
│       │   └── config/gameConfig.js
│       ├── utils/movementController.js
│       │   └── config/gameConfig.js
│       ├── components/CuteCat.js
│       │   └── config/gameConfig.js
│       ├── components/StarField.js
│       │   └── config/gameConfig.js
│       ├── components/Moon.js
│       │   └── config/gameConfig.js
│       ├── components/Floor.js
│       ├── components/ExitBeacon.js
│       └── config/gameConfig.js
└── reportWebVitals.js
```
