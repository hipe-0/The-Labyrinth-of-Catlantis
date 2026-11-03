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
3. Clicking **Start Game** sets `isGameStarted = true`.
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
| `playerRef` | `MazeScene` | mutable ref | Position, rotation, jump physics, collected set — updated every frame without re-rendering |
| `mazeData` | `MazeScene` | state | `{ maze, exitX, exitY, cats }` for the current level |
| `collectedCats` | `MazeScene` | `Set<number>` | Indices of collected cats; drives cat visibility |
| `skyColor` | `MazeScene` | string | Scene background colour; brightens with cats |
| `movementController` | `MazeScene` | memo | Closure over the current maze/cats with key handlers and the movement update |

### Why a ref for the player?

React state would re-render the whole scene 60 times per second. Instead the player is
a mutable object:

```js
playerRef.current = {
  x, y,                    // continuous world position (grid units)
  rotation, targetRotation,// radians, multiples of 45°
  targetX, targetY,        // interpolation targets
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
   └── if player is on the exit cell AND collectedCats.size === 6:
         generate a new maze, reset player to (1,1), clear cats, sky → black, return

2. movementController.updatePlayerMovement(player, delta, cats, setCollectedCats, setSkyColor)
   ├── apply jump physics (gravity)
   ├── read keyState (arrow keys)
   ├── attempt forward/backward movement with collision
   ├── collect a cat if the target cell contains one (forward or backward)
   ├── advance targetRotation by 45° while a turn key is held
   └── interpolate x/y toward targetX/targetY

3. camera.position = (player.x, 0.5 + jumpHeight, player.y)
   camera.rotation = (0, player.rotation, 0)

The directional moonlight follows the moon's world position; the shadow map refreshes a
few times per second while the moon moves.
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
fills an accumulator; each substep recomputes the movement target from the current
position, checks collision, collects cats, and moves 10% toward the target. This
reproduces the original 144 Hz PC movement feel on a 60 Hz phone, and the speed is the
same on every display. The accumulator is capped at 15 substeps to avoid a spiral of
death after a stall.

### Forward/backward

Forward vector depends on `rotation`:

```js
forwardX = -Math.sin(rotation) * MOVE_STRIDE
forwardZ = -Math.cos(rotation) * MOVE_STRIDE
```

- At `rotation = 0`, forward is `-Z` (north).
- At `rotation = -π/2`, forward is `+X` (east).
- Backward is the negation.

`MOVE_STRIDE` is `0.5`, so each key press attempts a half-cell step. Holding a key
repeats every fixed substep, and the target is recomputed from the current position, so
the player glides continuously.

### Collision

```js
gridX = Math.round(x)
gridZ = Math.round(z)
walkable = maze[gridZ] && maze[gridZ][gridX] !== 1
```

Only the **destination** cell is checked. Out-of-bounds rows return `undefined` and are
treated as blocked. Because the check uses rounding, a diagonal step can clip a wall
corner; there is no swept collision.

### Grid repel

`avoidGridLines(value)` pushes the target away from a fractional part of `0.5` (the
boundary between two cell centres) by `GRID_REPEL = 0.2`. The intent is to stop the
player from standing exactly on a cell boundary. In practice it makes step spacing
slightly irregular (e.g. `1 → 1.7 → 2.2 → 2.7 …`).

### Rotation

- Holding left/right sets `keyState`; the first press advances `targetRotation` by one
  45° step immediately.
- While held, a timer advances `targetRotation` by another `π/4` every
  `ROTATION_STEP_INTERVAL` (0.18 s), i.e. about **250°/s**. This is time-based, not
  frame-based, so 60 Hz and 144 Hz devices rotate at the same speed.
- `normalizeRotation` snaps the target to the nearest multiple of `π/4`.
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

Inside the movement update, for both forward and backward movement:

```js
catIndex = cats.findIndex(cat =>
  Math.round(cat.x) === Math.round(newTargetX) &&
  Math.round(cat.y) === Math.round(newTargetY)
)
```

If found and not already collected:

1. Copy `player.collectedCats`, add the index, store it back.
2. Call `setCollectedCats(newSet)` so React hides that cat.
3. Compute the new sky colour:

```js
lighten = (collected / 6) * 40
sky = hsl(240, 100 - lighten %, 50 + lighten / 2 %)
```

| Cats | Sky |
| --- | --- |
| 0 | `#000000` (initial state) |
| 1 | `hsl(240, 93.3%, 53.3%)` — blue |
| 3 | `hsl(240, 80%, 60%)` |
| 6 | `hsl(240, 60%, 70%)` — pale blue |

Both forward and backward movement check for cats.

### Completion

`checkExit` requires:

```js
Math.round(player.x) === exitX &&
Math.round(player.y) === exitY &&
collectedCats.size === 6
```

The continuous position is rounded to grid coordinates before comparison. On success
the scene:

- generates a new maze,
- resets `player.x/y/targetX/targetY` to `(1,1)`,
- resets `rotation` / `targetRotation` to face the first open neighbour of the new
  start cell,
- clears `player.collectedCats` and React's `collectedCats`,
- resets the sky to black.

---

## 8. Rendering

### Camera

- Perspective, FOV 75, near 0.1, far 1000.
- Position is overwritten every frame from the player.
- Height is `0.5 + jumpHeight`, so the eye is half a unit above the floor.
- Only Y rotation is applied.

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

A 100 × 100 dark plane rotated flat, at `y = -0.01`, so it sits just under the walls.
It both receives and casts shadows, so wall shadows fall across the floor.

### Moon

- Two emissive spheres: outer radius 5, inner radius 4.8 (slightly smaller, lighter).
- The moon sits at `[30, 30, 30]` inside an orbit group tilted by `π/4`.
- The orbit group rotates around the world origin at `ORBIT_SPEED`; the moon spins on
  its own Y axis at `SPIN_SPEED`.

### Star field

- 1000 points distributed on a sphere of radius 50.
- `pointsMaterial`, size 0.1, size attenuation.
- The whole field is tilted and slowly rotates.

### Exit beacon

- A dark-green cube at the exit cell.
- A 200-unit-tall white translucent cylinder beam above it.
- The beam bobs and tilts with `sin`/`cos` of elapsed time.
- Intended to be visible from anywhere in the maze.

### Lighting

- A single cool `directionalLight`, intensity `3`, color `#dfe8ff`, aimed at the maze
  centre `(15, 0, 15)`, casting soft shadows (2048² shadow map, PCFSoft).
- Its position is updated every frame from the moon's world position by `Moon.js`. The
  height is clamped to `MOON.MIN_LIGHT_HEIGHT` (30) so the light stays above the maze
  even when the visible moon dips toward the horizon; otherwise the floor is almost
  unlit and its shadows disappear.
- **No ambient fill.** Lit faces are bright; unlit faces stay black. The white
  `lineSegments` edges keep the maze readable in the dark.
- The floor uses a dark `#2A2A2A` material so it does not wash out the scene.
- Shadows must be enabled on the `<Canvas>` in `App.js` **before the first render**.
  Materials compile without shadow support if the shadow map is enabled later, and
  re-enabling it does not recompile them. `MazeScene` handles ACES tone mapping, sRGB
  output, and the shadow-map refresh.
- The shadow map is not updated every frame; it refreshes at 5 Hz while the moon moves
  and immediately when a new maze is generated.

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
                                                          (currently wrong keys)

useFrame(delta)
   ├─ checkExit ──► generateMaze() ──► setMazeData ──► re-render + new controller
   ├─ updatePlayerMovement
   │     ├─ collision against maze[][]
   │     ├─ cat hit ──► setCollectedCats ──► re-render (cat hidden)
   │     └─ sky update ──► setSkyColor ──► scene background
   └─ camera.position/rotation = player

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
- The code mixes two movement styles: continuous interpolation for rendering and
  grid rounding for collision/collection. This is the source of most of the current
  bugs.
