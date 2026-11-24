# wall-openings — window openings

Status: awaiting review
Captured: 2026.11.24
Lab: `src/lab/proposals/wall-openings.jsx`
Sheet: `doc/proposals/wall-openings/proposal.png`

## Options

| Number | Name | Opening | Sill | Lintel |
| --- | --- | --- | --- | --- |
| **56** | Low window | 0.90 × 0.35 | 0.35 | 0.30 |
| **57** | Tall slit | 0.55 × 0.55 | 0.30 | 0.15 |
| **58** | Wide ribbon | 1.60 × 0.30 | 0.40 | 0.30 |

Each option uses the same four-box split: sill, lintel, and two jambs. The opening
is an open hole, not a glass pane.

## What changes

- The back wall is split into four boxes around the opening.
- The three options differ only in the opening proportion.
- The white edges of the four pieces outline the window frame.

## What stays the same

- Wall thickness 0.12, height 1.0, white faces, and white edge lines.
- Maze generation, cat placement, lighting, and the collision world.
- The player still collides with the full wall box, not the hole.
- Sky palettes are untouched; the preview uses the in-game blue palette so the
  opening reads as sky.

## Decision needed

**Which option number should be approved: 56, 57, or 58?**

Also open:

- Open hole or a translucent glass pane?
- Interior walls only, or the outer boundary too?
- How many eligible segments should receive a window? The current suggestion is a
  low density (~10%) so the maze does not turn into confetti.

## Gate

No game runtime file has been changed. Reply with an option number, for example
`58 approved`. The agent marks that option approved in the option ledger, marks the
others not selected, and only then implements the chosen option in the game.
