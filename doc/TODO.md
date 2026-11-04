# TODO

Last updated: 2026-11-04.

Completed items stay here as a short record; open items keep the original
requirements.

1. [x] Slow the whole game down by half. Walking, held rotation, moon orbit,
   moon spin, and starfield speed are halved; jump physics is unchanged.
2. [x] Start with Enter or Space, not only the mouse.
3. [x] Improve shadows. The shadow frustum follows the player in a 20×20 zone
   with a 2048² map, refreshed every frame while walking and at 5 Hz when idle.
4. [x] Add three low-poly mountain rings around the maze. Radii 40 / 55 / 70,
   white ridge lines on black faces, as reviewed in
   `doc/mockups/horizon-silhouette.png`.
5. [x] Add procedural sounds: footsteps, speed-dependent wind, a near-exit beacon
   bell, cat meows, a start chime, and a level-complete arpeggio. No audio assets are
   needed; see `src/utils/audioEngine.js`.
6. [x] Replace destination-cell collision with a 2D player circle. The circle
   can never overlap a wall, slides along walls, and the camera follows it with
   a short clamped delay. Collision boxes live in a spatial hash so future props
   can reuse the same system.
7. [x] Exit sequence: the camera rises 30 world units over 5 seconds, tilts down,
   and turns toward the maze centre so the labyrinth can be seen from above. A
   splash screen then shows "Labyrinth cleared", the next level number, and a
   Start button. Wording and timings live in `GAME_CONFIG.LEVEL`.
8. [x] Clean out remaining prototype code and stale ideas. Removed the old movement
   model, CRA unused assets, `@react-three/drei`, `web-vitals`,
   `reportWebVitals`, and `@testing-library/user-event`. `deploy.sh` remains as an
   optional Bash alternative.
9. [x] Cats rocket into the sky with a meow when found. The sky colour lerps
   smoothly through the gradient palettes; the cat rises for 2.4 s, spins, and
   shrinks. Palette review image: `doc/mockups/sky-gradients.png`.
10. [x] Spawn facing an open neighbour instead of a wall.
11. [x] Move from "wall block / empty floor" cells to edge-based cells. Every cell
    stores north/east/south/west wall bits; the generator carves passages by removing
    shared edges, and rendering/collision both use merged thin wall segments.
12. [x] Initial roof/window proposal written: `doc/GEOMETRY_PROPOSAL.md` and
    `doc/mockups/wall-openings.svg`. It covers opening geometry, roof metadata,
    collision simplifications, tests, and a staged migration plan. Runtime
    implementation remains a follow-up.
13. [x] Remove the backward command and the down/backward arrow. The touch D-pad is
    now a single row of ← / ↑ / →, freeing portrait screen space.
