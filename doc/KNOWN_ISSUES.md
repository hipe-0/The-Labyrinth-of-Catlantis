# Known Issues and Rough Edges

These notes describe the current working tree (`Touch-control` branch). The high/medium
issues from the original touch refactor were fixed on **2026-11-02**, the
shadow-rendering regression was fixed on **2026-11-03**, and circle collision plus
procedural audio landed on **2026-11-04**; the remaining open items are marked in the
summary table. The detailed sections are kept as a record of the original analysis.

The 2025 touch-control refactor was incomplete: several things that worked in
the last commit (`258f564`) were broken while moving props around. Those regressions
have now been corrected in the working tree.

> Verified 2026-11-02: `origin/main` at `258f564` still has the correct cat wrapper,
> `ExitBeacon` props, and rounded exit check. The live site is built from the
> `gh-pages` branch at `1f41a2c`, which is based on the same `main` baseline.
>
> Update 2026-11-04: `gh-pages` was redeployed at `af242d4` from the `Touch-control`
> tree, so the live site now serves the current game.

---

## Fixes applied on 2026-11-04

| Area | Change | File |
| --- | --- | --- |
| Collision | The player is a 2D circle tested against wall AABBs in a spatial hash; movement is axis-separated so the circle slides along walls and can never overlap one | `collision.js`, `movementController.js`, `gameConfig.js` |
| Camera | Camera follows the circle centre with clamped exponential smoothing, keeping it inside the collision radius | `MazeScene.js`, `gameConfig.js` |
| Cat pickup | Proximity-based pickup instead of rounded destination-cell equality | `movementController.js` |
| Exit | Distance-based exit check (`EXIT_REACH_RADIUS = 0.5`) instead of grid rounding | `MazeScene.js` |
| Audio | Procedural footsteps, speed-dependent wind, a near-exit beacon bell, cat meow, start chime, and level-complete arpeggio | `audioEngine.js`, `App.js`, `MazeScene.js` |
| Level transition | Exit triggers a 5 s camera fly-up/tilt/yaw toward the maze centre, then a splash screen; Start generates the next maze | `MazeScene.js`, `App.js`, `StartScreen.js`, `takeoff.js`, `gameConfig.js` |
| Cat reward | Collected cats meow and rocket upward for 2.4 s while the sky palette lerps | `MazeScene.js`, `RocketCat.js`, `rocket.js`, `gameConfig.js` |
| Maze shape | Cells now store four edge-wall bits; passages carve shared edges and merged thin wall segments drive both rendering and collision | `mazeGeneration.js`, `mazeWalls.js`, `collision.js`, `MazeScene.js`, `gameConfig.js` |
| Takeoff orientation | Camera Euler order is `YXZ`, so pitch stays downward after the yaw turns toward the maze centre | `MazeScene.js` |

---

## Fixes applied on 2026-11-03

| Area | Change | File |
| --- | --- | --- |
| Shadow rendering | The Canvas enables shadows before the first render, so materials compile with shadow support instead of silently dropping them | `App.js`, `MazeScene.js` |
| Floor lighting | The shadow-casting moonlight is clamped to a minimum height, so the floor stays lit and wall shadows remain visible while the moon orbits | `Moon.js`, `gameConfig.js` |
| Shadow quality | The shadow frustum follows the player in a 20×20 zone at 2048², instead of covering the whole maze at low resolution | `MazeScene.js`, `gameConfig.js` |
| Rotation feel | Held rotation advances continuously and snaps to 45° on release, removing stepwise hiccups | `movementController.js`, `gameConfig.js` |
| Horizon | Three low fractal mountain rings around the maze, leaving open sky above the horizon | `HorizonMountains.js`, `fractal.js`, `gameConfig.js` |
| Sky | Shader gradient sky with seven palettes and a halo centred on the moon; moon moved behind the horizon rings | `SkyGradient.js`, `Moon.js`, `gameConfig.js` |

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
| Cat pickup | Cats can be collected while moving forward | `movementController.js` |
| Cat spawn | Start cell excluded from random cat placement | `mazeGeneration.js` |
| Mobile viewport | Fixed body/viewport sizing, black background, no landscape scroll or white band | `index.css`, `App.js` |
| Portrait controls | Larger responsive D-pad and Jump buttons | `TouchControls.js` |
| Touch performance | Ref-based touch input (no 3D re-render), DPR cap, follow-player shadow map | `App.js`, `MazeScene.js` |
| Moonlight | Directional light follows the moon's world position; aims at the maze centre | `Moon.js`, `MazeScene.js` |
| Movement timing | Fixed 144 Hz substeps; same walking speed on 60/144 Hz displays | `movementController.js`, `gameConfig.js` |
| Floor shadows | Floor receives and casts shadows | `Floor.js` |
| Shadow map | 2048² map over a 20×20 zone that follows the player; refreshed every frame while walking and at 5 Hz when idle | `MazeScene.js` |
| Rotation timing | Continuous ~250°/s hold with a 45° snap on release; same at 60/144 Hz | `movementController.js`, `gameConfig.js` |

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
| 12 | Fixed | Low | Collision only checks the destination cell; corner clipping is possible | `movementController.js`, `collision.js` |
| 13 | Moot | Low | `receiveShadow` props are ignored by cat/beacon components | `CuteCat.js`, `ExitBeacon.js` |
| 14 | Fixed | Low | `physicallyCorrectLights` is a no-op in Three.js r174 | `MazeScene.js` |
| 15 | Fixed | Low | React keys use filtered array indices | `MazeScene.js` |
| 16 | Fixed | Low | CRA leftovers removed, unused deps dropped, smoke/regression tests added; `deploy.sh`, CI, and license remain optional | various |
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

The shadow frustum follows the player in a 20×20 zone and refreshes every frame while
walking (and immediately on a new maze). While standing still it refreshes at 5 Hz so
the slowly moving moon still updates the light without a full shadow pass every frame.

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

**Severity: low — fixed 2026-11-04**

The old controller only checked the rounded destination cell, so a diagonal step could
pass through a wall corner.

Collision is now a 2D circle (radius 0.2) tested against wall AABBs registered in a
spatial hash. Movement is subdivided and resolved one axis at a time, so the circle
slides along walls, cannot overlap one, and cannot tunnel through corners. See
`src/utils/collision.js` and the tests in `collision.test.js`.

---

## 13. `receiveShadow` is ignored

**Severity: low — moot**

`MazeScene.js` no longer passes `receiveShadow` to `<CuteCat>` or `<ExitBeacon>`, so the
components are not relying on a prop they ignore. The cat and beacon meshes do not
receive shadows explicitly; add it directly if that becomes visible.

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

**Severity: low — fixed 2026-11-04**

| Item | Note |
| --- | --- |
| `public/index.html` | Game title and description |
| `public/manifest.json` | Game name and black background |
| `src/App.css`, `src/logo.svg` | Removed (unused CRA styles/logo) |
| `@react-three/drei` | Removed from dependencies (never imported) |
| `web-vitals` / `src/reportWebVitals.js` | Removed (called without a callback, so it did nothing) |
| `@testing-library/user-event` | Removed (never imported) |
| `src/setupTests.js` | Smoke and regression tests added |
| `node/` | Removed (empty stray folder) |
| `build/` | Git-ignored; rebuild before deploying |
| `README.md` | Links to this `doc/` folder |
| `deploy.sh` | Kept as the Bash alternative; prefer `npm run deploy` |

---

## Non-issues / intentional choices

These look odd but are part of the design:

- **No visible player model** — the camera is the player; this is a first-person game.
- **45° rotation steps** — arrow left/right rotate in eighth-turns, not free-look.
- **Free movement inside cells** — the player is a circle, not a grid token, so it can
  stand anywhere in a walkable cell as long as it does not overlap a wall.
- **Sky starts black** — the first cat starts the gradient, which is the intended
  reward feedback.
- **Rooms can create loops** — the recursive backtracker produces a perfect maze, then
  `createRooms` deliberately opens areas.
- **Cats can spawn near the start** — there is no minimum distance from `(1,1)`.
- **No score/level counter** — finishing regenerates the maze in place.

---

## Next work

The remaining feature requests are tracked in [TODO.md](TODO.md). The old "fix order"
list is obsolete: the regressions it described are fixed.
