# Visual proposals

Mockups for the next visual pass. They are references, not final assets.

## `horizon-silhouette.png`

Three concentric low-poly mountain rings around the 31 × 31 maze:

- Ring radii ≈ 26, 36, 46 world units from the maze centre `(15, 15)`.
- Heights ≈ 10 units for all three, deliberately near-equal so the ridgelines cross.
- Ridges are built from coarse control points followed by 3 midpoint-displacement
  passes, not a regular zigzag.
- Black faces with white ridge lines, matching the wall style.
- The nearest ring has the brightest outline; farther rings are dimmer for depth.
- The near black fill masks the middle layer, which masks the far layer; the crossed
  white outlines make the fake-parallax effect readable.
- A recentred/extended ground plane is required so the rings fit.

## `sky-gradients.png`

Six top-to-bottom sunset gradients. The first four are the requested families:
blue, green, purple, yellow. Rose and teal are optional variants for the remaining
cats. The horizon glow sits at the bottom, behind the maze silhouette.

## Decisions still open

1. Horizon: are the radii and the fractal detail level close enough to build?
2. Horizon: are equal heights the right amount of intersection, or should the near ring
   be slightly lower/higher?
3. Horizon: should the far ring be dimmer, or all outlines equal white?
4. Sky: which six palettes should be assigned to the six cats?
5. Sky: keep the optional rose/teal variants or use only the four requested families?
