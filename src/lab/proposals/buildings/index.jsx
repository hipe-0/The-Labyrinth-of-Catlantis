// Buildings inside the maze — options 62 / 63 / 64.
//
// Each building is a sealed 1x1 grid cell (walls on all four sides), inserted
// before the labyrinth is carved. Height is randomised 1.0–3.0 in the game; the
// five samples here cover the range. Nothing is in the game until approval.
import React from 'react';

import { StreetScene } from './street';
import option62 from './62';
import option63 from './63';
import option64 from './64';

const camera = {
  position: [4.9, 4.6, 11.2],
  target: [4.6, 1.0, 3.1],
  fov: 38,
  skyIndex: 1,
};

const proposal = {
  id: 'buildings',
  title: 'Buildings inside the maze',
  subtitle:
    'Five 1x1 sealed cells inserted before the maze is carved. Building sides continue the 0.12 wall plane; heights run 1.08–2.90 against the 1.0 walls. The game still has no buildings.',
  camera,
  baseline: {
    label: 'Current',
    tag: 'In-game today',
    description:
      'No buildings: the five sealed cells are still plain maze corridors and every wall is 1.0 high.',
    render: () => <StreetScene />,
  },
  options: [option62, option63, option64],
};

export default proposal;
