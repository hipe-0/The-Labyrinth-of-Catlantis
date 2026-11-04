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
debug logs.

### `Start Game.bat` (added with this documentation)

Windows launcher. Checks that Node.js is available, installs dependencies if
`node_modules/react-scripts` is missing, then runs `npm start`. See
[RUNNING.md](RUNNING.md#launcher).

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
- Title and description are the game's own; no custom fonts or scripts.

### `public/manifest.json`

PWA manifest with the game's name, short name, and black background. Only affects
installability/branding.

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

- State: `isGameStarted`, `hasTouch`, `showLevelScreen`, `completedLevel`,
  `levelStartRequest`; refs: `touchDirectionRef`, `jumpRequestRef`, `audioRef`.
- Renders `<StartScreen onStart={...}>` until the game starts. Starting (button,
  Enter, or Space) creates/resumes the procedural audio engine and plays the start
  chime.
- After start, renders a full-screen `<Canvas>` (75° FOV, near 0.1, far 1000, initial
  camera `[1, 0.5, 1]`, antialias, DPR capped at 1.5) containing `<MazeScene>`.
- Passes `touchDirectionRef`, `jumpRequestRef`, the audio engine,
  `levelStartRequest`, and `onLevelComplete` down to `MazeScene`.
- On level completion, shows a second `<StartScreen>` over the frozen final fly-up
  frame with "Labyrinth cleared", the next level number, and a Start button. Start
  increments `levelStartRequest` so `MazeScene` builds the next maze.
- Shows `<TouchControls>` once `hasTouch` is true, hidden while the level splash is up.
- `handleTouchMove(direction)` writes the ref; `handleTouchJump()` increments the jump
  ref. Neither causes a 3D re-render.
- Wrapper is fixed to the viewport with `touchAction: 'none'`, `overscrollBehavior:
  'none'`, and overflow hidden to suppress scrolling and pull-to-refresh.

### `src/MazeScene.js`

The core of the game.

Responsibilities:

1. **Level state** — creates `mazeData` with `generateMaze()`, stores
   `collectedCats`, `skyIndex`, and the current `level`.
2. **Player ref** — mutable circle with position, rotation, movement accumulator,
   jump, and collected set. The initial rotation faces the first open neighbour of
   `(1,1)`.
3. **Controller** — `useMemo(() => createMovementController(...), [generatedMaze, cats,
   audio])`, with a cat callback that plays the meow.
4. **Input** — registers `keydown`/`keyup` on `document` while the game is started;
   reads `touchDirectionRef` and `jumpRequestRef` in `useFrame` and maps them to arrow
   keys / Space. Touch input does not re-render the 3D scene.
5. **Renderer setup** — `App.js` enables shadows on the `<Canvas>` before the first
   render (materials compile without shadow support if this happens later). `MazeScene`
   sets ACES tone mapping and sRGB output. The shadow frustum follows the player in a
   20×20 zone, refreshes every frame while walking, at 5 Hz when idle, and immediately
   on a new maze.
6. **Frame loop** — applies touch input, checks exit, updates circle movement and
   collision, updates audio, and moves the smoothed camera. Once the exit is reached,
   `phaseRef` switches to `takeoff` and the camera follows `getTakeoffPose`; after
   `onLevelComplete`, it holds `between-levels` until `levelStartRequest` changes.
7. **Scene graph** — sky gradient, moon-following directional light, Moon, StarField,
   Floor, HorizonMountains, ExitBeacon, cats, memoized walls.

Key constants used here: `CAMERA.EYE_HEIGHT`, directional light intensity `3`,
follow-player shadow target, 20×20 shadow zone, `2048²` map, wall random scale ranges,
exit beacon position, exit reach radius, camera follow lag, and `LEVEL` fly-up/splash
settings.

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
  FLOOR_SIZE: 180,
  MOVE_FIXED_STEP: 1 / 144, // fixed movement simulation step (same speed on 60/144 Hz)
  ROTATE_SMOOTHING: 15,     // exponential rotation smoothing rate (1/second)
  ROTATION_ANGLE: Math.PI / 4,
  ROTATION_STEP_INTERVAL: 0.18, // derives the continuous hold speed (45°/0.18 s ≈ 250°/s)
  ROTATION_THRESHOLD: 0.01,
  JUMP_VELOCITY: 4,
  GRAVITY: 9.8,
  PLAYER: { RADIUS, WALK_SPEED, CAT_PICKUP_RADIUS, EXIT_REACH_RADIUS },
  CAMERA: { EYE_HEIGHT, FOLLOW_SMOOTHING, MAX_LAG },
  LEVEL: { TAKEOFF_DURATION, TAKEOFF_HEIGHT, TAKEOFF_PITCH, COMPLETE_TITLE,
           START_BUTTON },
  AUDIO: { MASTER_VOLUME, WIND_MAX_VOLUME, FOOTSTEP_VOLUME, BEACON_INTERVAL,
           BEACON_RANGE, BEACON_VOLUME },
  SHADOW: { ZONE_HALF_SIZE, MAP_SIZE, IDLE_UPDATE_INTERVAL, MOVE_THRESHOLD },
  HORIZON: { RINGS, INITIAL_POINTS, INITIAL_JITTER, PASSES, AMPLITUDE, ROUGHNESS,
             TOP_BAND_HEIGHT },
  SKY: { STAR_COUNT, STAR_SIZE, STAR_RADIUS, ROTATION_SPEED, TILT_ANGLE,
         DOME_RADIUS, GLOW_STRENGTH, GLOW_POWER, TRANSITION_SPEED, GRADIENTS },
  MOON: { ORBIT_SPEED, SPIN_SPEED, POSITION, MIN_LIGHT_HEIGHT, SIZE, INNER_SIZE,
          SEGMENTS, OUTER_COLOR, INNER_COLOR, OUTER_EMISSIVE, INNER_EMISSIVE }
}
```

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

### `src/utils/fractal.js`

Pure fractal-ring generator used by the horizon mountains.

`generateFractalRing({ radius, seed, initialPoints, initialJitter, passes, amplitude,
roughness })` starts with a few control points around a circle and runs midpoint
displacement for each pass. It returns `{ angle, radius, x, z }` points in local space,
centred on the origin. The same seed always produces the same outline.

### `src/utils/collision.js`

Pure 2D circle-vs-AABB collision used by the movement controller.

- `circleIntersectsBox(x, z, radius, box)` — closest-point circle/box test.
- `createCollisionWorld()` — spatial hash of axis-aligned boxes with
  `addBox`, `overlapsCircle`, `overlappingBoxes`, and `resolvePenetration`.
- `moveCircle(world, x, z, dx, dz, radius)` — subdivides displacement, resolves X then
  Z (or Z then X), rejects axes that would overlap a box, and returns the final
  position. The remaining axis slides along the wall.
- `createMazeCollisionWorld(maze)` — registers every `1` cell as a 1×1 box and adds four
  outer fence boxes so the player cannot leave the maze.

The spatial hash keeps lookups local, so additional props can add boxes without
scanning the whole maze.

### `src/utils/audioEngine.js`

Procedural Web Audio engine. `GAME_CONFIG.AUDIO` holds the master/footstep/wind levels
and the beacon interval.

- `start()` — creates/resumes the context on the Start gesture and plays a rising chime.
- `meow()` — pitch-bent sawtooth through a band-pass formant.
- `levelComplete()` — four-note arpeggio.
- `update({ moving, speed, x, z, rotation, exitX, exitY }, delta)` — speed-dependent
  wind, alternating footsteps timed by actual travel distance, and a soft beacon bell
  when the exit is within `AUDIO.BEACON_RANGE`, panned toward it.
- `dispose()` — closes the context when the app unmounts.

If `window.AudioContext` is unavailable, every method is a safe no-op.

### `src/utils/movementController.js`

Factory that closes over the maze, player ref, setters, cats, and an optional
`onCatCollected` callback.

Exports `createMovementController`. Returned object:

| Member | Purpose |
| --- | --- |
| `handleKeyDown(event)` | Arrow up/down set movement state; left/right start continuous rotation while held; space starts a jump |
| `handleKeyUp(event)` | Clears movement/rotation state |
| `updatePlayerMovement(player, delta)` | Jump physics, fixed-step circle movement, wall sliding, cat pickup, continuous rotation |
| `keyState` | Raw arrow-key booleans (exposed for debugging) |

Internal helpers:

- `normalizeRotation(rotation)` — snap to 45° multiples.
- `movePlayer(player)` — moves the circle with `moveCircle` and checks cat proximity.
- `collectCatNear(x, z)` — collects a cat within `PLAYER.CAT_PICKUP_RADIUS`.

This file contains the movement model described in
[ARCHITECTURE.md](ARCHITECTURE.md#6-movement-model).

### `src/utils/takeoff.js`

Pure camera math for the level-complete fly-up.

- `smoothStep(value)` — clamped smoothstep easing.
- `shortestAngle(from, to)` — signed shortest angular difference.
- `getTakeoffPose({ fromX, fromZ, fromYaw, elapsed, duration, mazeCenter, height,
  pitch, startHeight })` — returns the fixed X/Z, rising Y, eased pitch, and yaw turning
  toward the maze centre. Used by `MazeScene` and covered by `takeoff.test.js`.

### `src/components/StartScreen.js`

Full-screen DOM overlay, reused for the initial start screen and the level-complete
splash.

Props:

- `onStart` — Start button / Enter / Space callback.
- `title`, `subtitle`, `buttonLabel`, `hint`, `controlsHint` — optional copy. Defaults
  are the title screen text; the level splash passes "Labyrinth cleared", the next
  level number, and "Start".

No Three.js.

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

One 180 × 180 plane, rotated flat (`-π/2` on X), centred on the maze at
`(15, -0.01, 15)`, dark gray (`#2A2A2A`), standard material. It both receives and
casts shadows. No props.

### `src/components/HorizonMountains.js`

Three decorative fractal mountain rings centred on the maze:

- Radii `40`, `55`, `70`; heights `7`, `9.5`, `12`.
- Built from `generateFractalRing` (coarse control points plus 3 midpoint-displacement
  passes), so each ring has an irregular low-poly outline.
- Black `meshBasicMaterial` walls with a white top band. The near band is brightest;
  the far band is dimmest. No lighting, shadows, or collision.
- Geometry is generated once with `useMemo` and disposed on unmount.

### `src/components/Moon.js`

Two nested emissive spheres:

- Outer: radius 15, white, emissive intensity 0.5.
- Inner: radius 14.4, light gray, emissive intensity 0.3.
- The moon sits at `[90, 90, 90]`, well outside the 70-unit horizon ring, so the
  mountains occlude it when it is low.
- Wrapped in an orbit group tilted by `SKY.TILT_ANGLE` and rotated on Y over time.
- The moon itself spins on Y.
- Receives `lightRef`; every frame copies the moon's world position into the
  directional light so the moonlight direction follows the visible moon. The Y
  coordinate is clamped to `MOON.MIN_LIGHT_HEIGHT` so the light never drops to the
  horizon and leaves the floor unlit. `MazeScene` then shifts the light with the player
  so the shadow frustum follows without changing the direction.
- Receives `positionRef`; writes the visual moon position there for `SkyGradient`.

Reads all values from `GAME_CONFIG.MOON`.

### `src/components/StarField.js`

- Builds a `THREE.BufferGeometry` with `STAR_COUNT` (1000) random points on a sphere of
  radius `STAR_RADIUS` (200), outside the horizon rings.
- Renders `<points>` with white `pointsMaterial`, size `0.4`, size attenuation.
- Rotates the field slowly; tilted by `TILT_ANGLE`.
- Geometry is memoized but never explicitly disposed.

### `src/components/SkyGradient.js`

A 400-unit `BackSide` sphere with a custom shader:

- Blends `topColor`, `mid1Color`, `mid2Color`, and `horizonColor` vertically from the
  zenith to the horizon.
- `moonPositionRef` feeds the shader a moon direction; the halo uses
  `pow(dot(viewDir, moonDir), 24)`, so it is centred on the moon.
- Seven palettes (night + six cat rewards) are stored in `SKY.GRADIENTS`; colours and
  glow strength lerp smoothly after each pickup.
- `depthWrite={false}` and `renderOrder={-1}` keep the sky behind the moon, stars,
  mountains, and maze.

---

## `src/` — leftovers and styling

### `src/index.css`

Full-screen mobile reset: `html`, `body`, and `#root` fill the viewport with a black
background and `overflow: hidden`; `body` is fixed to the viewport and disables
overscroll/touch gestures. This prevents landscape scrolling and white bands. Also
contains the system font stack and font smoothing.

### `src/reportWebVitals.js`

CRA performance helper. `index.js` calls it without a callback, so it does nothing.
Kept as boilerplate.

### `src/setupTests.js`

Imports `@testing-library/jest-dom` for Jest. Tests cover the Enter/Space start keys,
spawn orientation, fractal ring generation, continuous hold rotation, circle collision
and wall sliding, cat pickup, the silent audio fallback, and the takeoff camera math.

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
│   ├── utils/audioEngine.js
│   │   └── config/gameConfig.js
│   └── MazeScene.js
│       ├── utils/mazeGeneration.js
│       │   └── config/gameConfig.js
│       ├── utils/movementController.js
│       │   ├── utils/collision.js
│       │   └── config/gameConfig.js
│       ├── utils/takeoff.js
│       ├── components/CuteCat.js
│       │   └── config/gameConfig.js
│       ├── components/StarField.js
│       │   └── config/gameConfig.js
│       ├── components/SkyGradient.js
│       │   └── config/gameConfig.js
│       ├── components/Moon.js
│       │   └── config/gameConfig.js
│       ├── components/Floor.js
│       ├── components/ExitBeacon.js
│       └── config/gameConfig.js
└── reportWebVitals.js
```
