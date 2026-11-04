# Architecture

This document explains how the game actually runs: the React tree, who owns which
state, the per-frame loop, the maze algorithm, the movement model, and the 3D scene.

---

## 1. Two layers

The app is split into a thin **React/UI layer** and a **3D scene layer**.

```text
index.js
└── <React.StrictMode>
    └── <App>                         React state: started? touch?
        ├── <StartScreen>             plain DOM overlay (title + button)
        └── <Canvas>                  React Three Fiber root
            └── <MazeScene>           all game state + useFrame loop
                ├── <Moon>
                ├── <StarField>
                ├── <Floor>
                ├── <ExitBeacon>
                ├── <CuteCat> × 6
                └── wall <group> × ~240
```

`App` does not know anything about the maze. `MazeScene` does not render any DOM; it
only returns Three.js objects through R3F.

---

## 2. Boot sequence

1. `src/index.js` creates the React root on `#root` and renders `<App />` in
   `StrictMode` (development double-invokes some lifecycles).
2. `App` starts with `isGameStarted = false`, so only `<StartScreen>` is shown.
3. Clicking **Start Game**, pressing Enter, or pressing Space sets
   `isGameStarted = true`. The same gesture creates/resumes the audio context,
   because browsers block Web Audio until the user interacts.
4. The `<Canvas>` mounts with a 75° FOV camera and creates `<MazeScene>`.
5. `MazeScene` lazily creates the first maze with
   `useState(() => generateMaze())` — this runs once per mount.
6. `useFrame` starts driving the player and camera every animation frame.

Because the `<Canvas>` only exists after Start is pressed, all game objects are
created fresh on start. There is no "restart" button; finishing a level regenerates the
maze in place.

---

## 3. State ownership

| State | Where | Type | Purpose |
| --- | --- | --- | --- |
| `isGameStarted` | `App` | boolean | Switches start screen ↔ canvas |
| `touchDirectionRef` | `App` | ref | Latest touch D-pad direction; read by `MazeScene` in `useFrame` |
| `jumpRequestRef` | `App` | ref | Jump request counter; read by `MazeScene` in `useFrame` |
| `hasTouch` | `App` | boolean | Shows touch controls after the first touch |
| `audioRef` | `App` | ref | Procedural sound engine, created on the first Start gesture |
| `playerRef` | `MazeScene` | mutable ref | Circle position, rotation, jump physics, collected set — updated every frame without re-rendering |
| `cameraFollowRef` | `MazeScene` | ref | Smoothed camera position that follows the player circle |
| `mazeData` | `MazeScene` | state | `{ maze, exitX, exitY, cats }` for the current level |
| `collectedCats` | `MazeScene` | `Set<number>` | Indices of collected cats; drives cat visibility |
| `skyIndex` | `MazeScene` | number | Palette index for `SkyGradient`; advances with cats |
| `movementController` | `MazeScene` | memo | Closure over the current maze/cats with key handlers and the movement update |

### Why a ref for the player?

React state would re-render the whole scene 60 times per second. Instead the player is
a mutable object:

```js
playerRef.current = {
  x, y,                    // circle centre in world units (y is world Z)
  rotation, targetRotation,// radians, multiples of 45°
  movementAccumulator,     // fixed-timestep leftover
  jumpVelocity, jumpHeight, isJumping,
  collectedCats            // mirror of the React Set, used inside the controller
}
```

Only discrete events (collecting a cat, changing sky, finishing a level) call
`setState` and trigger a render.

There is intentional duplication between `player.collectedCats` and the React
`collectedCats` state: the controller needs a synchronous set, while React needs a new
reference to re-render. They are kept in sync in `movementController.js`.

---

## 4. The frame loop

`MazeScene` registers one `useFrame` callback. Every frame it does, in order:

```text
1. checkExit()
   └── if the player circle is within EXIT_REACH_RADIUS of the exit centre
       AND collectedCats.size === 6:
          generate a new maze, reset player to (1,1), clear cats, sky → black,
          play the level-complete arpeggio, snap the camera, return

2. movementController.updatePlayerMovement(player, delta)
   ├── apply jump physics (gravity)
   ├── read keyState (arrow keys)
   ├── advance targetRotation continuously while a turn key is held
   ├── run fixed 1/144 s substeps:
   │     ├── move the player circle at WALK_SPEED with wall sliding
   │     └── collect any cat within CAT_PICKUP_RADIUS
   └── smooth rotation toward targetRotation

3. audio.update(...)
   ├── wind gain and footsteps follow the distance actually travelled
   ├── a soft bell rings only when the exit is within BEACON_RANGE
   └── no sound when walking into a wall

4. camera follows the circle centre with clamped exponential smoothing
   camera.position = (follow.x, 0.5 + jumpHeight, follow.z)
   camera.rotation = (0, player.rotation, 0)

The directional moonlight direction comes from the moon; the 20×20 shadow frustum
follows the player and refreshes while walking.
```

Important: the camera is the player. There is no visible avatar; first-person view is
the whole character.

`delta` (seconds since last frame) drives jump physics, rotation timing, and the movement
simulator. Movement runs in fixed `1/144 s` substeps, so 60 Hz phones and 144 Hz PCs
travel at the same speed. Rotation uses a fixed time-based step interval plus
exponential smoothing, so the turn rate is also identical across refresh rates.

---

## 5. Maze generation

File: `src/utils/mazeGeneration.js`

### Representation

`maze` is a 2D array `maze[y][x]` of size 31 × 31:

| Value | Meaning |
| --- | --- |
| `1` | wall |
| `0` | walkable floor |
| `2` | exit cell (also walkable) |

`x` is the column (world X), `y` is the row (world Z).

### Algorithm

1. **Fill** with walls (`createEmptyMaze`).
2. **Recursive backtracker** (`carvePassages`) starting at `(1,1)`:
   - Mark the current cell as floor.
   - Consider neighbours two cells away in the four cardinal directions, in random
     order.
   - If a neighbour is in bounds and still a wall, carve the cell between them and
     recurse.
   - Because the step is 2 on an odd-sized grid, this produces the classic
     "perfect maze" with walls on even coordinates and corridors on odd ones.
3. **Force the start open** (`maze[1][1] = 0`).
4. **Set the exit** at `(MAZE_WIDTH - 2, MAZE_HEIGHT - 2)` = `(29, 29)`, value `2`.
5. **Carve 3–5 random rooms** (`createRooms`): each room is 2–4 cells wide/high and
   clears its rectangle, which can open walls and create loops/open areas.
6. **Place 6 cats** (`placeCats`): random walkable cells, no duplicate coordinates,
   each assigned one of four palettes (`white`, `black`, `gray`, `mix`).
7. Return `{ maze, exitX, exitY, cats }`.

The recursive backtracker is depth-first; on a 31 × 31 grid the recursion depth stays
around a few hundred calls, well within normal stack limits.

### Tunable dimensions

`MAZE_WIDTH` and `MAZE_HEIGHT` live in `src/config/gameConfig.js`. The generator
assumes odd dimensions for the step-2 carving to line up with the borders.

---

## 6. Movement model

File: `src/utils/movementController.js`

`createMovementController(maze, playerRef, setCollectedCats, setSkyColor, cats)` returns:

```js
{ handleKeyDown, handleKeyUp, updatePlayerMovement, keyState }
```

### Input

`handleKeyDown` / `handleKeyUp` maintain a `keyState` object for the four arrow keys.
Space is handled immediately: if not already jumping, set
`jumpVelocity = JUMP_VELOCITY` and `jumpHeight = 0`.

The controller only understands `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, and
`' '` (space). The touch layer maps its four directions to those arrow keys.

### Fixed timestep

Movement is simulated in fixed `MOVE_FIXED_STEP = 1/144 s` substeps. The render delta
fills an accumulator; each substep moves the player circle by
`WALK_SPEED * MOVE_FIXED_STEP` (3.6 × 1/144 = 0.025 world units), checks collision, and
collects any nearby cat. This keeps the speed identical on 60 Hz and 144 Hz displays.
The accumulator is capped at 15 substeps to avoid a spiral of death after a stall.

### Forward/backward

The forward vector depends on `rotation`:

```js
forwardX = -Math.sin(rotation)
forwardZ = -Math.cos(rotation)
```

- At `rotation = 0`, forward is `-Z` (north).
- At `rotation = -π/2`, forward is `+X` (east).
- Backward is the negation.

Movement is continuous: holding a key moves at `WALK_SPEED` every substep.

### Collision

The player is a 2D circle of radius `PLAYER.RADIUS = 0.2` on the floor plane. Every wall
cell is registered as a 1×1 axis-aligned box in a spatial hash
(`src/utils/collision.js`). Each simulated step is split into sub-steps no larger than
half the radius, then resolved one axis at a time:

```text
try X: if the new circle overlaps a box, reject X
try Z: if the new circle overlaps a box, reject Z
```

Because the other axis still moves, the circle **slides along walls** instead of
sticking. The circle can touch a wall but can never overlap it; there is no corner
clipping and no tunnelling. `resolvePenetration` is a safety net for teleports or props
added on top of the player. Four outer boxes fence the maze so future generators cannot
let the player escape. Cat pickup and the exit check use distances from the circle
centre, not rounded grid cells.

### Rotation

- Holding left/right sets `keyState`; the first press advances `targetRotation` by one
  45° step immediately.
- While held, `targetRotation` advances continuously at
  `ROTATION_ANGLE / ROTATION_STEP_INTERVAL` (45° / 0.18 s ≈ **250°/s**). Continuous
  target motion avoids the stop-start “hiccups” of stepping the target every 45°. This
  is time-based, not frame-based, so 60 Hz and 144 Hz devices rotate at the same speed.
- On release, `normalizeRotation` snaps the target to the nearest multiple of `π/4` so
  movement stays grid-aligned.
- `rotation` interpolates toward `targetRotation` using exponential smoothing
  (`1 - exp(-ROTATE_SMOOTHING * delta)`) and snaps when within `ROTATION_THRESHOLD`.
- Continuous rotation is driven by `keyState`; touch buttons keep the direction held
  until pointer release, so touch and keyboard behave the same.

### Jump

```text
velocity -= GRAVITY * delta
height   += velocity * delta
if height <= 0: height = 0, velocity = 0, isJumping = false
```

With `JUMP_VELOCITY = 4` and `GRAVITY = 9.8`, the jump lasts roughly 0.8 s and peaks
around 0.8 world units. The camera rises with the jump; collision is unaffected while
airborne.

---

## 7. Cat collection and level completion

### Collection

After each moved substep, the controller checks the distance from the circle centre:

```js
catIndex = cats.findIndex(cat =>
  Math.hypot(cat.x - player.x, cat.y - player.y) <= 0.55
)
```

If found and not already collected:

1. Copy `player.collectedCats`, add the index, store it back.
2. Call `setCollectedCats(newSet)` so React hides that cat.
3. Call `setSkyIndex(newCollectedCats.size)` to advance the sky palette.
4. Call the optional `onCatCollected` callback, which plays the meow.

Forward and backward movement both collect cats.

### Sky palettes

`SkyGradient` lerps between seven palettes: a night palette plus blue, green, purple,
yellow, rose, and teal for the six cats. The transition is smooth and time-based, so the
sky does not jump when a cat is collected.

| Cats | Palette |
| --- | --- |
| 0 | Night |
| 1 | Blue |
| 2 | Green |
| 3 | Purple |
| 4 | Yellow |
| 5 | Rose |
| 6 | Teal |

### Completion

`checkExit` requires the circle centre to be within `PLAYER.EXIT_REACH_RADIUS` (0.5) of
the exit centre and all cats to be collected:

```js
const dx = player.x - exitX;
const dz = player.y - exitY;

dx * dx + dz * dz <= PLAYER.EXIT_REACH_RADIUS ** 2 &&
  collectedCats.size === 6
```

On success the scene:

- plays the level-complete arpeggio,
- generates a new maze,
- resets `player.x/y` to `(1,1)`,
- resets `rotation` / `targetRotation` to face the first open neighbour of the new
  start cell,
- clears `player.collectedCats` and React's `collectedCats`,
- resets the sky to black,
- snaps the camera to the new spawn.

---

## 8. Rendering

### Camera

- Perspective, FOV 75, near 0.1, far 1000.
- Position follows the player circle with exponential smoothing
  (`CAMERA.FOLLOW_SMOOTHING = 20/s`), clamped to `CAMERA.MAX_LAG = 0.12` world units.
  The clamp keeps the camera inside the collision circle, so it cannot enter a wall.
- The follow position snaps to `(1,1)` when a new maze starts.
- Height is `0.5 + jumpHeight`, so the eye is half a unit above the floor.
- Only Y rotation is applied; rotation is already smoothed by the controller.

### Walls

For every cell equal to `1`:

- A 1 × 1 × 1 white box, scaled:
  - horizontal scale is usually `1`; 10% of walls get `0.85–1.15`,
  - vertical scale is usually `1`; 20% of walls get `0.5–3.0`.
- The group is placed at `y = verticalScale / 2`, so the box base sits on the floor.
- White `lineSegments` edges are added on top for a wireframe look.
- The random scale variations are memoized per maze, so they stay stable across
  re-renders (collecting a cat, pressing a touch button, etc.).

### Floor

A 180 × 180 dark plane rotated flat, centred on the maze at `(15, -0.01, 15)`, so it
sits just under the walls and extends out to the horizon rings. It both receives and
casts shadows, so wall shadows fall across the floor.

### Horizon mountains

- Three decorative fractal rings centred on the maze, at radii `40`, `55`, and `70`.
- Heights are `7`, `9.5`, and `12`, so the silhouettes stay visually close from inside
  the maze and leave plenty of sky visible above them.
- Each ring starts from coarse control points and gets 3 midpoint-displacement passes.
- Black basic-material walls with a white top band; the near band is brightest and the
  far band dimmest. No lighting, collisions, or shadows.
- The rings are outside the maze and are purely decorative.

### Moon

- Two emissive spheres: outer radius 15, inner radius 14.4 (slightly smaller, lighter).
- The moon sits at `[90, 90, 90]` inside an orbit group tilted by `π/4`, well outside
  the 70-unit horizon ring, so the mountains occlude it when it is low.
- The orbit group rotates around the world origin at `ORBIT_SPEED`; the moon spins on
  its own Y axis at `SPIN_SPEED`.
- Its world position is also published to `SkyGradient` so the sky halo stays centred
  on the visible moon.

### Star field

- 1000 points distributed on a sphere of radius 200, outside the horizon rings.
- `pointsMaterial`, size 0.4, size attenuation.
- The whole field is tilted and slowly rotates.

### Sky gradient

- A 400-unit `BackSide` sphere with a custom shader; the camera far plane is 1000.
- The shader blends four vertical colours from the horizon to the zenith.
- Seven palettes: a night palette plus blue, green, purple, yellow, rose, and teal for
  the six cats. The colours lerp smoothly after each pickup.
- A moon halo is added with `pow(max(dot(viewDir, moonDir), 0), 24)`, so it is always
  centred on the moon rather than the screen.
- The sky mesh has `depthWrite={false}` and `renderOrder={-1}` so the moon, stars,
  mountains, and maze draw in front of it.

### Exit beacon

- A dark-green cube at the exit cell.
- A 200-unit-tall white translucent cylinder beam above it.
- The beam bobs and tilts with `sin`/`cos` of elapsed time.
- Intended to be visible from anywhere in the maze.

### Lighting

- A single cool `directionalLight`, intensity `3`, color `#dfe8ff`, casting soft
  shadows (PCFSoft). The shadow zone is a 20×20 world-unit area around the player with a
  2048² map, giving about 100 shadow texels per world unit. The shadow camera far plane
  is `400` because the moon now sits roughly 156 units from the maze centre.
- `Moon.js` sets the light direction from the moon's world position. The height is
  clamped to `MOON.MIN_LIGHT_HEIGHT` (30) so the light stays above the maze even when
  the visible moon dips toward the horizon; otherwise the floor is almost unlit and its
  shadows disappear.
- The light target follows the player. The light position is shifted by the same offset
  from the maze centre, so the moonlight direction stays constant while the shadow
  frustum moves with the player.
- **No ambient fill.** Lit faces are bright; unlit faces stay black. The white
  `lineSegments` edges keep the maze readable in the dark.
- The floor uses a dark `#2A2A2A` material so it does not wash out the scene.
- Shadows must be enabled on the `<Canvas>` in `App.js` **before the first render**.
  Materials compile without shadow support if the shadow map is enabled later, and
  re-enabling it does not recompile them. `MazeScene` handles ACES tone mapping, sRGB
  output, and the shadow-map refresh.
- The shadow map refreshes every frame while the player walks, at 5 Hz while standing
  still (so the slowly moving moon still updates the light), and immediately when a new
  maze is generated.

---

## 9. Coordinate system

| Concept | Maze array | World |
| --- | --- | --- |
| Column | `maze[y][x]` / `x` | X |
| Row | `maze[y][x]` / `y` | Z |
| Up | — | Y |
| Start | `(1, 1)` | `(1, 0.5, 1)` camera |
| Exit | `(29, 29)` | `(29, ?, 29)` |
| Cell centre | integer `(x, y)` | `(x, 0, y)` |
| Wall base | — | `y = 0` |

The game uses "y" for the maze row in 2D code but "y" for height in 3D code. Watch this
when reading `player.x` / `player.y`: `player.y` is the **world Z / maze row**, not
height. Height is `jumpHeight`.

---

## 10. Data flow summary

```text
keydown/keyup ──► movementController.keyState
touch D-pad ────► App.touchDirectionRef ──► MazeScene useFrame ──► arrows ──► controller
touch Jump ─────► App.jumpRequestRef ────► MazeScene useFrame ──► Space ──► controller

useFrame(delta)
   ├─ checkExit ──► generateMaze() ──► setMazeData ──► re-render + new controller
   ├─ updatePlayerMovement
   │     ├─ circle collision against wall boxes ──► slide along walls
   │     ├─ cat hit ──► setCollectedCats ──► re-render (cat hidden)
   │     └─ sky update ──► setSkyIndex ──► SkyGradient palette lerp
   ├─ audio.update ──► wind/footsteps/beacon
   └─ camera follow (smoothed, clamped) + rotation

React render
   ├─ walls from generatedMaze
   ├─ cats filtered by collectedCats
   └─ ExitBeacon at exit coords
```

---

## 11. Design observations

- The game loop is intentionally simple: one mutable player object, one controller
  closure, one frame callback.
- The maze is regenerated wholesale rather than reset, so there is no level counter or
  persistent score.
- All tuning lives in `gameConfig.js`, except a few hard-coded values (6 cats, exit
  margin of 2, wall randomisation ranges, camera height 0.5, light position 30).
- Collision is now geometry-based rather than grid-rounding based. Future props can be
  added as collision boxes without changing the movement controller.
- Audio is synthesised at runtime, so there are no asset-loading states or missing-file
  errors. The engine is silent in browsers without Web Audio.
