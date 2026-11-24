// src/lab/proposals/_template.jsx
//
// Always exactly three numbered options. Allocate the numbers with:
//   npm run proposal:new -- <slug> "Short title"
// That command updates src/lab/option-ledger.json and copies this template with
// the three numbers filled in. Never type or reuse an option number by hand.
//
// Rules for a useful proposal:
//   1. Use a fixed camera. No pointer controls and no random layouts.
//   2. Show the current game as `baseline`, then exactly three `options`.
//   3. Change one visual idea per proposal; each option explores that idea.
//   4. Keep it lab-only. Never edit game runtime files to make a preview.
import React from 'react';

import { WallBox } from '../LabStage';

const camera = {
  position: [4.25, 0.62, 6.6],
  target: [4.25, 0.55, 4.1],
  fov: 70,
  skyIndex: 1,
};

const Baseline = () => (
  <WallBox position={[4.25, 0.5, 4.1]} size={[2.8, 1, 0.12]} />
);

const OptionOne = () => (
  <WallBox
    position={[4.25, 0.5, 4.1]}
    size={[2.8, 1, 0.12]}
    faceColor="#161A21"
  />
);

const OptionTwo = () => (
  <WallBox
    position={[4.25, 0.5, 4.1]}
    size={[2.1, 1, 0.12]}
    faceColor="#161A21"
  />
);

const OptionThree = () => (
  <WallBox
    position={[4.25, 0.5, 4.1]}
    size={[3.4, 1, 0.12]}
    faceColor="#161A21"
  />
);

const proposal = {
  id: 'replace-me',
  title: 'Short proposal title',
  subtitle:
    'One or two sentences describing the visual idea and what is not changing.',
  status: 'awaiting-review',
  camera,
  baseline: {
    label: 'Current',
    tag: 'In-game today',
    description: 'What the game does today.',
    render: () => <Baseline />,
  },
  options: [
    {
      number: 0,
      label: 'Option A',
      description: 'Describe this option in one line.',
      render: () => <OptionOne />,
    },
    {
      number: 0,
      label: 'Option B',
      description: 'Describe this option in one line.',
      render: () => <OptionTwo />,
    },
    {
      number: 0,
      label: 'Option C',
      description: 'Describe this option in one line.',
      render: () => <OptionThree />,
    },
  ],
  notes: {
    changed: ['What changes across the three options.'],
    unchanged: ['What stays exactly the same.'],
    decisions: ['Which option number should be approved?'],
  },
};

export default proposal;
