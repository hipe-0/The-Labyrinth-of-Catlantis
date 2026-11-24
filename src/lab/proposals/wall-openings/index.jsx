// Window openings in maze walls — options 56 / 57 / 58.
//
// Each numbered file beside this index is one complete option. Its PNG has the
// same number. The game is untouched until one number is approved.
import React from 'react';

import { RoomScene } from './room';
import option56 from './56';
import option57 from './57';
import option58 from './58';

const camera = {
  position: [4.25, 0.62, 6.6],
  target: [4.25, 0.55, 4.1],
  fov: 70,
  skyIndex: 1,
};

const proposal = {
  id: 'wall-openings',
  title: 'Window openings in maze walls',
  subtitle:
    'Three window proportions for the same 1.0-high wall. Same low-poly language, a real hole for the sky. Lab preview only — the game still renders solid walls.',
  camera,
  baseline: {
    label: 'Current',
    tag: 'In-game today',
    description:
      'Solid 1.0-high wall: one white box with the existing white edge outline.',
    render: () => <RoomScene windowSpec={null} />,
  },
  options: [option56, option57, option58],
};

export default proposal;
