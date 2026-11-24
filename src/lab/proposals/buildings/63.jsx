// Option 63 — Night windows
import React from 'react';

import { StreetScene } from './street';

const option = {
  number: 63,
  label: 'Night windows',
  description:
    'Same white blocks, plus small warm window lights (about 60% lit). A minimal signal that a cell is a building, readable from the maze floor. Heights 1.08 · 1.55 · 2.05 · 2.35 · 2.90.',
  render: () => <StreetScene treatment="windows" />,
};

export default option;
