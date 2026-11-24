# mountain-span — mountain silhouette height span

Status: awaiting review
Captured: 2026.11.24
Lab: `src/lab/proposals/mountain-span.jsx`
Sheet: `doc/proposals/mountain-span/proposal.png`

## Options

| Number | Name | Span (near / mid / far) | Ridge frequency |
| --- | --- | --- | --- |
| **59** | Broad ridge | 16 / 20 / 24 | 3 |
| **60** | Jagged range | 20 / 26 / 32 | 5 |
| **61** | Dramatic skyline | 24 / 30 / 36 | 7 |

All three keep the current ring heights (`7 / 9.5 / 12`) as the center of the
profile. The ridgeline goes above and below that center; anything below `y = 0` is
clamped to the ground. The white top band follows the ridge, and the black faces,
ring radii, seeds, and depth opacities are unchanged.

## Preview scene

The lab camera sits inside an **open floor square with no maze walls**, looking out
at the rings. This is deliberate: the wall geometry would hide the lower part of
the silhouette, and the height span is the thing being reviewed.

## What changes

- The horizon rings get a real height profile instead of a flat top.
- The peak-to-valley span is larger, so the skyline has more zigzag.
- Ground-level valleys create gaps between mountain sections.
- The white top band follows the new silhouette.

## What stays the same

- Ring radii 40 / 55 / 70 and seeds 101 / 202 / 303.
- Ring heights stay the center of the profile (7 / 9.5 / 12).
- Black faces, white bands, and the near-dim / far-bright depth cue.
- Sky, moon, stars, maze, collision, and gameplay.

## Decision needed

**Which option number should be approved: 59, 60, or 61?**

Also open:

- Are the ground-level gaps the right amount, or should the valleys stay higher?
- Should all three rings share the same profile, or should the far ring be more
  jagged?

## Gate

No game runtime file has been changed. Reply with an option number, for example
`60 approved`. The agent marks that option approved in the option ledger, marks the
others not selected, and only then implements the chosen ridge in the game.
