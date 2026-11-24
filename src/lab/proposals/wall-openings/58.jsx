// Option 58 — Wide ribbon
import React from 'react';

import { RoomScene, WINDOW_SPECS } from './room';

const option = {
  number: 58,
  label: 'Wide ribbon',
  description: '1.60 wide × 0.30 high · sill 0.40 · lintel 0.30',
  render: () => <RoomScene windowSpec={WINDOW_SPECS[58]} />,
};

export default option;
