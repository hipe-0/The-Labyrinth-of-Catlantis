# Geometry Proposal — Roofs and Window Openings

This is the initial engine proposal for the "more complex shapes later" direction in
the TODO. It builds on the edge-based maze that now stores north/east/south/west wall
bits and merges collinear runs into thin wall segments.

Mockup: [`mockups/wall-openings.svg`](mockups/wall-openings.svg) /
[`mockups/wall-openings.png`](mockups/wall-openings.png)

> Status: proposal only. No roof/window geometry is enabled in the game yet.

---

## 1. Goals

- Keep the current low-poly black/white look.
- Add rectangular window openings to walls without CSG or expensive geometry.
- Add optional roofs and skylights for rooms, primarily visible in the level-complete
  fly-up overview.
- Keep collision cheap and predictable: the player remains a 2D circle against boxes.
- Preserve the current maze generator and all existing tests.

---

## 2. Data model

The current cell already has a wall bitmask:

```js
cell = {
  walls: WALL_NORTH | WALL_EAST | WALL_SOUTH | WALL_WEST,
  exit: false,
}
```

Extend it with optional feature metadata:

```js
cell = {
  walls: 7,
  exit: false,
  roof: {
    type: 'flat' | 'gable',
    height: 1.4,
    skylight: { width: 0.5, depth: 0.4 },
  },
  wallFeatures: {
    [WALL_NORTH]: [{ type: 'window', offset: 0.3, width: 0.4, sill: 0.45, height: 0.35 }],
  },
}
```

Only canonical walls need features (north and west, plus the east/south outer edge), so
a shared wall cannot receive two different windows by accident.

An alternative is a separate `wallFeatures` map in `generateMaze()` keyed by the merged
wall key (`h:boundaryZ:startX:endX`). That is cleaner once wall segments are merged,
because a window can be positioned relative to the final segment length. Start with the
per-wall map in the generator and resolve it to the merged segment in `mazeWalls.js`.

---

## 3. Wall openings

### Geometry

A window is a rectangular hole with four ranges:

```text
sill          = 0.45   // bottom of the opening
height        = 0.35   // opening height
sill + height = 0.80   // top of the opening
offset        = 0.30   // distance from the left end of the segment
width         = 0.40   // opening width
```

For one wall segment, render up to four boxes:

```text
        lintel
   ┌──────────────┐
   │              │
   │   window     │  <- sky/room visible through the hole
   │              │
   ├──────────────┤
   │     sill     │
   └──────────────┘
   jamb          jamb
```

- **Sill** — from `y = 0` to `y = sill`.
- **Lintel** — from `y = sill + height` to `WALL.HEIGHT`.
- **Jambs** — left and right strips beside the opening, full wall height.
- If the window touches a segment end, omit the corresponding jamb.

This is exactly four boxes per opening and needs no triangulation or CSG. The boxes use
the same white edge material as the current walls.

### Glass

Two options:

1. **Open hole** (recommended first): the sky/room behind is visible; no extra material.
2. **Translucent pane**: a thin `meshBasicMaterial` plane with low opacity and no depth
   write, plus the white frame. Good for rooms where the interior should not be visible.

Start with the open hole. Add a pane only if the look needs it.

### Collision

The player is a 2D floor circle, so a window above the floor does not create a passage.
Keep the existing full wall box as the collision shape. This means:

- No changes to `createMazeCollisionWorld` or `movementController`.
- A future "crouch" or climb mechanic can add a separate low box for the sill, or remove
  the wall collider and add sill/jamb colliders.
- Windows on the outer boundary are allowed and will show the horizon.

---

## 4. Roofs

### Why roofs are not just another wall mesh

Roofs over the whole maze would block the moonlight and make the first-person view very
dark. They also hide the maze from the fly-up overview unless the camera is above them.

Recommended approach:

- Store roof metadata per cell (flat or gable).
- Only render roofs when `phase === 'takeoff'` / `between-levels`, with a fade-in as the
  camera rises.
- Inside normal play, roofs are invisible so the existing lighting and sky remain.
- A skylight opening uses the same splitting code as a wall window, but on the roof
  plane.

### Roof shapes

- **Flat roof** — one thin box over the cell at `y = WALL.HEIGHT + roof.height`.
- **Gable roof** — two sloped planes meeting at a ridge. Low-poly, black faces with white
  ridge/edge lines, matching the horizon mountains.
- A roof can cover one cell or a room rectangle.

### Overview reveal

During takeoff:

```text
t = 0 → 1
roofOpacity = smoothstep(0.25, 0.9, t)
```

Roofs fade in after the camera has started rising. This keeps the ground-level game
unchanged and makes the final overview richer.

---

## 5. Generator changes

Add a post-processing pass after rooms and before cats:

```js
addWallFeatures(maze, {
  windowChance: 0.12,
  minSegmentLength: 1,
  interiorOnly: true,
});
addRoofs(maze, {
  roomChance: 0.35,
  style: 'gable',
});
```

Rules:

- Only interior walls (not the outer boundary) for the first window pass.
- Only merged segments longer than `minSegmentLength`.
- Do not place a window on a wall that already has a door/passage (it has no wall).
- Windows never affect connectivity or cat placement.
- Roofs never affect collision.

Keep both passes deterministic from a level seed if reproducibility is added later. For
now, `Math.random()` is consistent with the rest of the generator.

---

## 6. Rendering changes

`mazeWalls.js` already merges collinear segments. Extend each segment with `openings`:

```js
{
  key: 'h:12.5:4:9',
  orientation: 'horizontal',
  minX, maxX, minZ, maxZ,
  openings: [
    { type: 'window', offset: 0.6, width: 0.4, sill: 0.45, height: 0.35 },
  ],
}
```

Add a pure helper:

```js
splitWallSegment(segment, WALL) -> pieces[]
```

It returns boxes for the sill, lintel, jambs, and the full segment when there are no
openings. `MazeScene` renders `pieces` instead of one box per segment. `collision.js`
continues to use the unsplit segment box.

For roofs, add a `Roof` component or a `roofPieces` helper that renders flat slabs or
gable planes. Render it only while the camera is in the overview phase.

---

## 7. Performance

- Merged wall segments are already one box each; splitting adds at most 4 boxes per
  window.
- Keep window density low (≈10% of eligible segments) to avoid turning walls into confetti.
- Roofs are only mounted during the fly-up, so they add no ground-level draw calls.
- If draw calls become a problem, merge all wall pieces into one `BufferGeometry` per
  material; the data model already separates geometry from collision.

---

## 8. Tests

Pure tests, no R3F mounting:

- `splitWallSegment` with no opening → one piece.
- Window in the middle → four pieces with correct min/max ranges.
- Window touching the left/right end → three pieces.
- Clamp a window that is wider than the segment.
- Roof piece generation for flat and gable styles.
- Existing maze connectivity and collision tests must keep passing.

---

## 9. Migration plan

1. **Window geometry** — add `wallFeatures` metadata and `splitWallSegment`, render
   openings with density 0 by default; add tests.
2. **Enable windows** — turn on a small density for interior walls and review the look.
3. **Roofs** — add roof metadata and flat/gable pieces; render only in the overview.
4. **Polish** — optional glass panes, skylights, door openings, and roof edge lines.

Steps 1–2 are low-risk: collision and gameplay do not change. Step 3 is visual and can
be feature-flagged behind `FEATURES.ROOFS`.

---

## 10. Open decisions

1. Should windows show the open sky (hole) or a translucent pane?
2. Should roofs appear only in the takeoff overview, or also over selected rooms during
   play?
3. Flat roofs, gable roofs, or both?
4. Should outer-boundary walls get windows, or only interior walls?
5. Window density and size ranges.
