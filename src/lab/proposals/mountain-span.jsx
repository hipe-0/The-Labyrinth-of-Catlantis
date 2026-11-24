// src/lab/proposals/mountain-span.jsx
//
// PROPOSAL ONLY. The game still renders the flat-topped HorizonMountains
// component. This lab previews three ridgeline height spans on an open floor
// square with no maze walls, so the silhouette is unobstructed.
import React from 'react';

import { HorizonMountains } from '../../components/HorizonMountains';
import { MountainRings } from '../mountainRing';

const SPANS_59 = [16, 20, 24];
const SPANS_60 = [20, 26, 32];
const SPANS_61 = [24, 30, 36];

const Baseline = () => <HorizonMountains />;
const Option59 = () => <MountainRings spans={SPANS_59} frequency={3} />;
const Option60 = () => <MountainRings spans={SPANS_60} frequency={5} />;
const Option61 = () => <MountainRings spans={SPANS_61} frequency={7} />;

const camera = {
  // An open square: the camera sits at the centre of the 31 x 31 footprint with
  // no walls around it, looking at the far side of the rings.
  position: [15, 1.2, 15],
  target: [15, 5.2, -10],
  fov: 62,
  skyIndex: 1,
  lightTarget: [15, 0, 15],
  lightPosition: [25, 30, 35],
  // Put the sky glow ahead of the camera so it sits above the ridgeline rather
  // than off to one side.
  moonPosition: [15, 30, -70],
};

const proposal = {
  id: 'mountain-span',
  title: 'Mountain silhouette height span',
  subtitle:
    'Three ridgelines for the horizon rings. The profile stays centered on the current ring heights (7 / 9.5 / 12) but has a larger height span; every part below y = 0 is clamped to the ground. Previewed on an open square with no maze walls.',
  status: 'awaiting-review',
  camera,
  baseline: {
    label: 'Current',
    tag: 'In-game today',
    description:
      'Current game: flat-topped rings at 7 / 9.5 / 12, with the white top band at a constant height.',
    render: () => <Baseline />,
  },
  options: [
    {
      number: 59,
      label: 'Broad ridge',
      description:
        'Span 16 / 20 / 24 · broad 3-wave ridge · moderate peaks, valleys clamp to the ground.',
      render: () => <Option59 />,
    },
    {
      number: 60,
      label: 'Jagged range',
      description:
        'Span 20 / 26 / 32 · 5-wave ridge · more zigzag and larger gaps at ground level.',
      render: () => <Option60 />,
    },
    {
      number: 61,
      label: 'Dramatic skyline',
      description:
        'Span 24 / 30 / 36 · 7-wave ridge · tallest peaks and deepest ground-level gaps.',
      render: () => <Option61 />,
    },
  ],
  notes: {
    changed: [
      'The ring height now varies around the current center instead of staying flat-topped.',
      'The peak-to-valley span is larger; every part below y = 0 is clamped to the ground.',
      'The white top band follows the new ridgeline; the black faces and ring radii stay the same.',
      'The preview is an open floor square with no maze walls, so the mountains are unobstructed.',
    ],
    unchanged: [
      'Ring radii 40 / 55 / 70, seeds 101 / 202 / 303, radial jitter, and line opacities.',
      'The current ring heights (7 / 9.5 / 12) remain the center of the height profile.',
      'Sky, moon, stars, maze generation, collision, and gameplay.',
      'The near ring is dimmer and the far ring brighter, matching the current depth cue.',
    ],
    decisions: [
      'Which option number should be approved: 59, 60, or 61?',
      'Are the ground-level gaps the right amount, or should the valleys stay higher?',
      'Should all three rings share the same profile, or should the far ring be even more jagged?',
    ],
  },
};

export default proposal;
