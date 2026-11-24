// Option 56 — Low window
import React from 'react';

import { RoomScene, WINDOW_SPECS } from './room';

const option = {
  number: 56,
  label: 'Low window',
  description: '0.90 wide × 0.35 high · sill 0.35 · lintel 0.30',
  render: () => <RoomScene windowSpec={WINDOW_SPECS[56]} />,
};

export default option;
