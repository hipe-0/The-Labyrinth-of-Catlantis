// src/lab/proposals/_template.jsx
//
// Copy this file to <slug>.jsx, then add it to ./index.js. Keep the module
// default-export shape: the lab and the screenshot script rely on it.
//
// Rules for a useful proposal:
//   1. Use a fixed camera. No pointer controls and no random layouts.
//   2. Show the current game visual and the proposed visual in the same pose.
//   3. Change one visual idea per proposal unless the user asks for a combo.
//   4. Keep it lab-only. Never edit game runtime files to make a preview.
import React from 'react';

import { WallBox } from '../LabStage';

const camera = {
  position: [4.25, 0.62, 6.6],
  target: [4.25, 0.55, 4.1],
  fov: 70,
  skyIndex: 0,
};

const proposal = {
  id: 'replace-me',
  title: 'Short proposal title',
  subtitle: 'One or two sentences describing the visual change and what is not changing.',
  status: 'awaiting-review',
  camera,
  variants: [
    {
      id: 'current',
      label: 'Current',
      tag: 'In-game today',
      description: 'What the game does today.',
      render: () => (
        <WallBox position={[4.25, 0.5, 4.1]} size={[2.8, 1, 0.12]} />
      ),
    },
    {
      id: 'proposed',
      label: 'Proposed',
      tag: 'Lab only',
      description: 'What should change, in one line.',
      render: () => (
        <WallBox
          position={[4.25, 0.5, 4.1]}
          size={[2.8, 1, 0.12]}
          faceColor="#161A21"
        />
      ),
    },
  ],
  notes: {
    changed: ['What changes.'],
    unchanged: ['What stays exactly the same.'],
    decisions: ['What the user needs to decide.'],
  },
};

export default proposal;
