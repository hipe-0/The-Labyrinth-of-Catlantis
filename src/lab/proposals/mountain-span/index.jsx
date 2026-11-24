// Mountain silhouette height span — options 59 / 60 / 61.
//
// Each numbered file beside this index is one complete option. Its PNG has the
// same number. The game is untouched until one number is approved.
import React from 'react';

import { HorizonMountains } from '../../../components/HorizonMountains';
import option59 from './59';
import option60 from './60';
import option61 from './61';

const camera = {
  // Open floor square: centre of the 31 x 31 footprint, no walls, looking at
  // the far side of the rings.
  position: [15, 1.2, 15],
  target: [15, 5.2, -10],
  fov: 62,
  skyIndex: 1,
  lightTarget: [15, 0, 15],
  lightPosition: [25, 30, 35],
  // Put the sky glow ahead of the camera so it sits above the ridgeline.
  moonPosition: [15, 30, -70],
};

const proposal = {
  id: 'mountain-span',
  title: 'Mountain silhouette height span',
  subtitle:
    'Three ridgelines for the horizon rings. The profile is centered on the current ring heights (7 / 9.5 / 12) with a larger height span; every part below y = 0 is clamped to the ground. Open square, no walls.',
  camera,
  baseline: {
    label: 'Current',
    tag: 'In-game today',
    description:
      'Current game: flat-topped rings at 7 / 9.5 / 12, with the white top band at a constant height.',
    render: () => <HorizonMountains />,
  },
  options: [option59, option60, option61],
};

export default proposal;
