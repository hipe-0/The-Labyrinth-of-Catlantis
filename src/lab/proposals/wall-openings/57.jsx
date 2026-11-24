// Option 57 — Tall slit
import React from 'react';

import { RoomScene, WINDOW_SPECS } from './room';

const option = {
  number: 57,
  label: 'Tall slit',
  description: '0.55 wide × 0.55 high · sill 0.30 · lintel 0.15',
  render: () => <RoomScene windowSpec={WINDOW_SPECS[57]} />,
};

export default option;
