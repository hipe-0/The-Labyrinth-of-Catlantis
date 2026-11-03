# Visual proposals

Mockups for the next visual pass. They are references, not final assets.

## `horizon-silhouette.png`

The in-game build was tuned lower and farther out after the first visual check:
radii `40 / 55 / 70`, heights `7 / 9.5 / 12`, with white top bands. The PNG below is the
approved review version (closer rings, near-equal heights).

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
- 3D note: from inside the maze, equal physical heights make the nearest ring look
  tallest. To keep the ridgelines intersecting on screen, the physical heights should
  grow with the ring radius so their angular heights stay close; the exact values need
  a quick in-engine test.

## `sky-gradients.png`

Six top-to-bottom sunset gradients. The first four are the requested families:
blue, green, purple, yellow. Rose and teal are optional variants for the remaining
cats. The horizon glow sits at the bottom, behind the maze silhouette.

Implemented in `src/components/SkyGradient.js`. The glow is now a halo centred on the
moon (not the bottom of the screen), and the palette advances after each cat.

## Decisions still open

1. Horizon: are the radii and the fractal detail level close enough to build?
2. Horizon: are equal heights the right amount of intersection, or should the near ring
   be slightly lower/higher?
3. Horizon: should the far ring be dimmer, or all outlines equal white?
4. Sky: which six palettes should be assigned to the six cats?
5. Sky: keep the optional rose/teal variants or use only the four requested families?
6. 3D: should physical heights scale with radius (for example 10 / 13 / 16) so the
   ridgelines stay visually close from inside the maze?
