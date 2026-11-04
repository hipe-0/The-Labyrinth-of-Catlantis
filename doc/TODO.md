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
7. [ ] Exit sequence: the player takes off, flies slowly into the sky, and the
   camera tilts down to reveal the labyrinth. Announce the next labyrinth with a
   splash screen (text TBD) and a Start button.
8. [ ] Clean out remaining prototype code and stale ideas. (Partly done:
   CRA leftovers and the old movement model are gone; still review unused
   dependencies, deploy script, and docs.)
9. [ ] Cats rocket into the sky with a meow when found. Sky colours are already
   gradient palettes and the meow is implemented; the take-off animation is
   still open. Palette review image: `doc/mockups/sky-gradients.png`.
10. [x] Spawn facing an open neighbour instead of a wall.
11. [ ] Move from "wall block / empty floor" cells to edge-based cells (north
    wall, west wall, or both). Generate that kind of maze and update collision.
12. [ ] Start the engine work needed for richer geometry later: roofs and window
    openings in walls. Make an initial proposal and keep collision extensible.
13. [ ] Remove the backward command and the down/backward arrow to free space on
    portrait mobile screens.
