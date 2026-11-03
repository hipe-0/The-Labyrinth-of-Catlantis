# Known Issues and Rough Edges

These notes describe the current working tree (`Touch-control` branch, with
uncommitted changes). The high/medium issues from the original touch refactor were
fixed on **2026-11-02**, and the shadow-rendering regression was fixed on
**2026-11-03**; the remaining open items are marked in the summary table.
The detailed sections are kept as a record of the original analysis.

The uncommitted touch-control refactor was incomplete: several things that worked in
the last commit (`258f564`) were broken while moving props around. Those regressions
have now been corrected in the working tree.

> Verified 2026-11-02: `origin/main` at `258f564` still has the correct cat wrapper,
> `ExitBeacon` props, and rounded exit check. The live site is built from the
> `gh-pages` branch at `1f41a2c`, which is based on the same `main` baseline.

---

## Fixes applied on 2026-11-03

| Area | Change | File |
| --- | --- | --- |
| Shadow rendering | The Canvas enables shadows before the first render, so materials compile with shadow support instead of silently dropping them | `App.js`, `MazeScene.js` |
| Floor lighting | The shadow-casting moonlight is clamped to a minimum height, so the floor stays lit and wall shadows remain visible while the moon orbits | `Moon.js`, `gameConfig.js` |

---

## Fixes applied on 2026-11-02

| Area | Change | File |
| --- | --- | --- |
| Touch movement | Touch directions now send `ArrowUp/Down/Left/Right` instead of `w/a/s/d` | `MazeScene.js` |
| Touch rotation | Continuous smooth rotation while held (restored 2025 behavior) | `movementController.js` |
| Touch jump | Jump request counter wired to the controller | `App.js`, `MazeScene.js` |
| Touch layout | Two-row D-pad, responsive sizes, safe-area bottom offset, pointer events | `TouchControls.js`, `public/index.html` |
| Wall jitter | Wall scale variations are memoized per maze instead of re-rolled on every render | `MazeScene.js` |
| Cat placement | Cats wrapped in positioned groups, colours passed, `y = 0` base | `MazeScene.js` |
| Exit beacon | Correct `exitX`/`exitY` props restored | `MazeScene.js` |
| Win check | Rounded grid coordinates instead of exact float equality | `MazeScene.js` |
| Lighting | Harsh directional moonlight with black unlit faces; no ambient wash | `MazeScene.js`, `Floor.js` |
| Spawn view | Player faces the first open neighbour of the start cell | `MazeScene.js` |
| Cat pickup | Cats can be collected while moving forward or backward | `movementController.js` |
| Cat spawn | Start cell excluded from random cat placement | `mazeGeneration.js` |
| Mobile viewport | Fixed body/viewport sizing, black background, no landscape scroll or white band | `index.css`, `App.js` |
| Portrait controls | Larger responsive D-pad and Jump buttons | `TouchControls.js` |
| Touch performance | Ref-based touch input (no 3D re-render), DPR cap, shadow map refreshed 5 Hz with the moon | `App.js`, `MazeScene.js` |
| Moonlight | Directional light follows the moon's world position; aims at the maze centre | `Moon.js`, `MazeScene.js` |
| Movement timing | Fixed 144 Hz substeps; same walking speed on 60/144 Hz displays | `movementController.js`, `gameConfig.js` |
| Floor shadows | Floor receives and casts shadows | `Floor.js` |
| Shadow map | 2048² shadow map, refreshed at 5 Hz with the moon | `MazeScene.js` |
| Rotation timing | Time-based 45° steps and exponential smoothing; same ~250°/s at 60/144 Hz | `movementController.js`, `gameConfig.js` |

---

## Severity summary

| # | Status | Severity | Issue | File |
| --- | --- | --- | --- | --- |
| 1 | Fixed | High | `CuteCat` ignores `position`; all cats render at the origin | `MazeScene.js`, `CuteCat.js` |
| 2 | Fixed | High | `ExitBeacon` receives `position` but expects `exitX`/`exitY`; position becomes `NaN` | `MazeScene.js`, `ExitBeacon.js` |
| 3 | Fixed | High | Win check uses exact floating-point equality; level is effectively unfinishable | `MazeScene.js` |
| 4 | Fixed | High | Touch D-pad sends `w/a/s/d`, controller only handles arrow keys | `MazeScene.js`, `movementController.js` |
| 5 | Fixed | Medium | Touch Jump button is a no-op | `App.js` |
| 6 | Fixed | Medium | Cat colours are never passed; every cat is white | `MazeScene.js` |
| 7 | Fixed | Medium | Cat Y position would make cats float if `position` were forwarded | `MazeScene.js` |
| 8 | Fixed | Medium | Wall scales are randomised during render and jitter on every re-render | `MazeScene.js` |
| 9 | Fixed | Low | Moon orbits but the directional moonlight stayed fixed | `Moon.js`, `MazeScene.js` |
| 10 | Fixed | Low | Movement interpolation was frame-rate dependent | `movementController.js` |
| 11 | Fixed | Low | Backward movement could not collect cats | `movementController.js` |
| 12 | Open | Low | Collision only checks the destination cell; corner clipping is possible | `movementController.js` |
| 13 | Open | Low | `receiveShadow` props are ignored by cat/beacon components | `CuteCat.js`, `ExitBeacon.js` |
| 14 | Fixed | Low | `physicallyCorrectLights` is a no-op in Three.js r174 | `MazeScene.js` |
| 15 | Fixed | Low | React keys use filtered array indices | `MazeScene.js` |
| 16 | Open | Low | CRA branding leftovers, unused files, no tests | various |
| 17 | Intentional | — | Holding a turn button rotates continuously; this is the intended 2025 behavior | `movementController.js` |
| 18 | Fixed | Medium | Scene could be nearly black and spawn could face a blank wall | `MazeScene.js` |
| 19 | Fixed | High | Landscape could scroll and expose a white band | `index.css`, `App.js` |
| 20 | Fixed | Medium | Portrait touch buttons were too small | `TouchControls.js` |
| 21 | Fixed | Medium | Touch input caused a 3D re-render on every press | `App.js`, `MazeScene.js` |
| 22 | Fixed | High | Rotation was ~3× faster at 144 Hz than at 60 Hz | `movementController.js`, `gameConfig.js` |
| 23 | Fixed | High | Shadows were enabled after the first render, so materials compiled without shadow support and never received them | `App.js`, `MazeScene.js` |
| 24 | Fixed | Medium | Moonlight followed the moon down to the horizon, leaving the floor unlit and floor shadows invisible | `Moon.js`, `gameConfig.js` |

> The detailed sections below preserve the original analysis. Items marked **Fixed**
> above are already corrected in the current source.

---

## 1. Cats render at the world origin

**Severity: high**

`MazeScene.js` (around line 154):

```jsx
{visibleCats.map((cat, index) => (
  <CuteCat
    key={index}
    position={[cat.x, 0.5, cat.y]}
    receiveShadow
  />
))}
```

`CuteCat.js` only accepts `color`:

```jsx
export function CuteCat({ color = 'white' }) {
  return <group> ... </group>;
}
```

React does not forward unused props to the returned element, so `position` and
`receiveShadow` are discarded. Every cat is created at `(0, 0, 0)`, which is a wall
cell in the corner of the maze.

**Fix options**

- Forward the props:

```jsx
export function CuteCat({ color = 'white', ...props }) {
  return <group {...props}> ... </group>;
}
```

- Or restore the old wrapper in `MazeScene.js`:

```jsx
<group key={`cat-${index}`} position={[cat.x, 0, cat.y]}>
  <CuteCat color={cat.color} />
</group>
```

The wrapper is the safer fix because it also lets you keep the model's intended
`y = 0` base.

---

## 2. Exit beacon is at a `NaN` position

**Severity: high**

`MazeScene.js` (line 153):

```jsx
<ExitBeacon position={[exitX, 0.5, exitY]} receiveShadow />
```

`ExitBeacon.js` expects different props:

```jsx
export function ExitBeacon({ exitX, exitY }) {
  ...
  return <group position={[exitX, 0.5, exitY]}> ... </group>;
}
```

`position` is ignored, `exitX`/`exitY` are `undefined`, and the group position becomes
`[undefined, 0.5, undefined]`. The resulting matrix is invalid, so the beacon is
missing or misrendered.

**Fix**

```jsx
<ExitBeacon exitX={exitX} exitY={exitY} />
```

or change the component to accept a `position` prop and use it directly.

---

## 3. The win condition can never be true (exact float equality)

**Severity: high**

`MazeScene.js` (lines 87–92):

```js
const checkExit = useCallback(() => {
  const player = playerRef.current;
  return player.x === exitX &&
         player.y === exitY &&
         player.collectedCats.size === 6;
}, [exitX, exitY]);
```

`player.x` / `player.y` are interpolated every frame:

```js
player.x += (player.targetX - player.x) * MOVE_SPEED;
```

They approach the target asymptotically and are almost never exactly equal to an
integer. On top of that, `MOVE_STRIDE = 0.5` and `avoidGridLines()` produce positions
such as `1.7`, `2.2`, `2.7`, … rather than landing on `29`.

The last commit used rounded coordinates, which is the intended behaviour:

```js
const gridX = Math.round(player.x);
const gridZ = Math.round(player.y);
return gridX === exitX && gridZ === exitY && player.collectedCats.size === 6;
```

**Fix**

Restore rounding, or use a distance threshold:

```js
const dx = player.x - exitX;
const dz = player.y - exitY;
return dx * dx + dz * dz < 0.25 && player.collectedCats.size === 6;
```

Also consider requiring the player to be on the exit cell rather than merely near it.

---

## 4. Touch D-pad does nothing

**Severity: high**

`MazeScene.js` (lines 47–62) maps touch directions to letters:

```js
if (touchDirection === 'forward') {
  movementController.handleKeyDown({ key: 'w' });
} else if (touchDirection === 'backward') {
  movementController.handleKeyDown({ key: 's' });
} else if (touchDirection === 'left') {
  movementController.handleKeyDown({ key: 'a' });
} else if (touchDirection === 'right') {
  movementController.handleKeyDown({ key: 'd' });
}
```

`movementController.js` only switches on `ArrowUp`, `ArrowDown`, `ArrowLeft`,
`ArrowRight`, and `' '`. `w/a/s/d` fall through to `default` and are ignored.

**Fix**

Send the arrow keys instead:

```js
movementController.handleKeyDown({ key: 'ArrowUp' });    // forward
movementController.handleKeyDown({ key: 'ArrowDown' });  // backward
movementController.handleKeyDown({ key: 'ArrowLeft' });  // left
movementController.handleKeyDown({ key: 'ArrowRight' }); // right
```

and the same keys in the `'stop'` branch for `handleKeyUp`. Alternatively, add
`w/a/s/d` cases to the controller (but then keyboard WASD would also start working,
which may be desirable).

---

## 5. Touch Jump button is a no-op

**Severity: medium**

`App.js` (lines 18–21):

```js
const handleTouchJump = () => {
  setHasTouch(true);
  // Jump action will be handled by the movement controller
};
```

Nothing is called. The keyboard jump lives inside the controller's `handleKeyDown`
(`case ' ':`) and the controller is created inside `MazeScene`, so `App` has no direct
access to it.

**Fix options**

- Pass a `jumpRequested` counter/boolean from `App` to `MazeScene`, and in a
  `useEffect` call `movementController.handleKeyDown({ key: ' ' })` when it changes.
- Or dispatch a synthetic keyboard event on `document` (the controller listens there):

```js
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
```

- Or expose a `jump()` function from the controller and pass it up through a ref.

The cleanest long-term design is to lift input into a small input manager shared by
keyboard and touch.

---

## 6. All cats are white

**Severity: medium**

`placeCats()` assigns a palette to each cat (`white`, `black`, `gray`, `mix`), but
`MazeScene.js` never passes `cat.color` to `CuteCat`. The component defaults to
`'white'`.

**Fix**

```jsx
<CuteCat color={cat.color} ... />
```

(when combined with the wrapper fix above).

---

## 7. Cats float half a unit above the floor

**Severity: medium**

The `CuteCat` model is built for a group at `y = 0`:

- body centre `0.15`, half-height `0.15` → bottom at `0`.
- head centre `0.45`, radius `0.25` → bottom at `0.20`.

`MazeScene.js` passes `position={[cat.x, 0.5, cat.y]}`. If `position` is forwarded, the
body bottom becomes `0.5`, so the cat hovers. The old code used `[cat.x, 0, cat.y]`.

**Fix**

Use `y = 0` for the cat group (and keep `y = 0.5` only for the camera/eye height).

---

## 8. Walls jitter on every re-render

**Severity: medium**

`MazeScene.js` (lines 165–171) computes random scales inside the render:

```jsx
const horizontalScaleX = Math.random() < 0.1
  ? Math.random() * 0.3 + 0.85
  : 1;

const verticalScale = Math.random() < 0.2
  ? Math.random() * 2.5 + 0.5
  : 1;
```

Every state update (collecting a cat, sky change, level regeneration) re-runs this and
changes the wall shapes. React StrictMode also double-renders in development, which can
make it worse.

**Fix**

Precompute wall variations once per maze:

```js
const wallVariations = useMemo(
  () => generatedMaze.map(row => row.map(() => ({
    h: Math.random() < 0.1 ? Math.random() * 0.3 + 0.85 : 1,
    v: Math.random() < 0.2 ? Math.random() * 2.5 + 0.5 : 1,
  }))),
  [generatedMaze]
);
```

or use a deterministic hash of `(x, z)` so the maze looks the same on every render.

---

## 9. Moon and moonlight are in sync

**Severity: low — fixed**

`Moon.js` puts the moon at `[30, 30, 30]` inside a group that rotates around the world
origin. The moon therefore moves in a circle. `Moon.js` now copies the moon's world
position into the directional light every frame, and `MazeScene.js` aims that light at
the maze centre `(15, 0, 15)`.

The shadow map is refreshed at 5 Hz while the moon moves (and immediately on a new
maze), so the shadows follow the light without paying for a full shadow pass every
frame.

---

## 10. Movement speed is normalized

**Severity: low — fixed**

`movementController.js` used a per-frame `MOVE_SPEED` factor, so 144 Hz PCs walked
faster than 60 Hz phones. Movement now runs in fixed `1/144 s` substeps: the render
delta fills an accumulator, and each substep recomputes the target, checks collision,
collects cats, and moves 10% toward the target.

This reproduces the original 144 Hz PC feel and makes walking speed identical on all
displays. The accumulator is capped at 15 substeps to avoid a spiral of death after a
stall.

---

## 11. Backward movement cannot collect cats

**Severity: low**

The cat lookup lives only inside the `ArrowUp` branch of `updatePlayerMovement`
(`movementController.js` lines 129–145). Walking backward over a cat does not collect
it.

**Fix**

Extract the cat check into a helper and call it after both forward and backward
movement (or after any successful position update).

---

## 12. Collision can clip wall corners

**Severity: low**

`checkCollision` only checks the rounded destination cell:

```js
return maze[Math.round(gridZ)] &&
       maze[Math.round(gridZ)][Math.round(gridX)] !== 1;
```

There is no check of the intermediate cell or the player's radius. A diagonal step can
pass through a wall corner. In practice the 45° movement and half-cell stride make this
rare, but it is possible.

**Fix**

Check both the X and Z grid cells crossed during the step, or use a small radius and
test the four neighbouring cells.

---

## 13. `receiveShadow` is ignored

**Severity: low**

`MazeScene.js` passes `receiveShadow` to `<CuteCat>` and `<ExitBeacon>`, but neither
component forwards unknown props to its meshes. Shadows may still be cast onto the
floor, but the cats/beacon will not receive shadows themselves.

**Fix**

Forward props (`...props`) to the root group/mesh, or explicitly set
`receiveShadow` on the meshes.

---

## 14. `physicallyCorrectLights` is a no-op

**Severity: low**

`MazeScene.js` (line 71):

```js
gl.physicallyCorrectLights = true;
```

This property was deprecated and removed in modern Three.js (r155+). In r174 lights
are physically correct by default. Setting it just adds an unused property. The same
applies to `gl.renderer = gl`, which is unnecessary.

**Fix**

Remove both lines. If the scene is too dark or too bright, tune the directional light
intensity instead (currently `3` at `[30, 40, 30]`).

---

## 15. React keys use filtered indices

**Severity: low**

```jsx
{visibleCats.map((cat, index) => (
  <CuteCat key={index} ... />
))}
```

`index` is the index in the **filtered** array, not the original cat index. When a cat
is removed, all later keys shift, causing React to remount/reuse the wrong components.
`CuteCat` is stateless so the visual impact is small, but it is fragile.

**Fix**

Keep the original index:

```jsx
{cats.map((cat, index) =>
  collectedCats.has(index) ? null : (
    <CuteCat key={`cat-${index}`} ... />
  )
)}
```

or give each cat a stable `id` in `placeCats()`.

---

## 16. CRA leftovers and housekeeping

**Severity: low**

| Item | Note |
| --- | --- |
| `public/index.html` | `<title>React App</title>`, CRA description |
| `public/manifest.json` | `"React App"` / `"Create React App Sample"` |
| `src/App.css` | Unused CRA starter styles |
| `src/logo.svg` | Unused React logo |
| `@react-three/drei` | Installed but never imported |
| `src/setupTests.js` | Jest setup; smoke tests added 2026-11-03 |
| `node/` | Empty stray folder (`node/maze-three-project/`) |
| `build/` | Stale generated output; rebuild before deploying |
| `README.md` | Short; does not mention this `doc/` folder |
| `deploy.sh` | Force-pushes local `main` to `gh-pages`; if you are on another branch, it may deploy stale code |

**Fix**

- Set a real title/description/manifest.
- Delete `App.css`, `logo.svg`, and the empty `node/` folder.
- Remove `@react-three/drei` from `package.json` if you do not plan to use it.
- Add at least a smoke test (render `<App />`, click Start, assert canvas exists).
- Prefer `npm run deploy` (builds the current tree) over `deploy.sh`.

---

## Non-issues / intentional choices

These look odd but are part of the design:

- **No visible player model** — the camera is the player; this is a first-person game.
- **45° rotation steps** — arrow left/right rotate in eighth-turns, not free-look.
- **Half-cell stride** — movement is continuous and collision is grid-rounded; the
  `avoidGridLines` repel is meant to keep the player off cell boundaries.
- **Sky starts black** — the first cat produces a visible blue jump; this is the
  intended reward feedback.
- **Rooms can create loops** — the recursive backtracker produces a perfect maze, then
  `createRooms` deliberately opens areas.
- **Cats can spawn near the start** — there is no minimum distance from `(1,1)`.
- **No score/level counter** — finishing regenerates the maze in place.

---

## Suggested fix order

If you want to make the current branch playable again with minimal changes:

1. Fix `ExitBeacon` props (`exitX`/`exitY`).
2. Restore the positioned `<group>` wrapper for cats and pass `color`.
3. Round coordinates in `checkExit` (or use a distance threshold).
4. Map touch directions to arrow keys.
5. Wire the Jump button.
6. Move wall randomisation into `useMemo`.
7. Then polish: moon light, frame-rate-independent movement, keys, branding.

All of these are small, isolated changes. None require restructuring the architecture.
