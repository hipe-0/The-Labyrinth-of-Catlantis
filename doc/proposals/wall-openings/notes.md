# wall-openings — window openings

Status: awaiting review
Captured: 2026.11.24
Lab: `src/lab/proposals/wall-openings.jsx`
PNG: `doc/proposals/wall-openings/proposal.png`

## What changes

- The back wall is split into four boxes around a 0.90 × 0.35 opening.
- The opening is an open hole: the night sky is visible through it, with no glass
  pane.
- The white edges of the four pieces outline the new window frame.

## What stays the same

- Wall thickness 0.12, height 1.0, white faces, and white edge lines.
- Maze generation, cat placement, lighting, and the collision world.
- The player still collides with the full wall box, not the hole.
- Sky palettes are untouched; the preview uses the in-game blue palette so the
  opening reads as sky.

## Decisions needed

1. Approve the look, or adjust the opening size / sill height?
2. Open hole or a translucent glass pane?
3. Interior walls only, or the outer boundary too?
4. How many eligible segments should receive a window? The current proposal
   suggests a low density (~10%) so the maze does not turn into confetti.

## Gate

No game runtime file has been changed. This proposal becomes a game commit only
after the user explicitly approves the PNG.
