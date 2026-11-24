// Option 60 — Jagged range
import React from 'react';

import { MountainRings } from '../../mountainRing';

const spans = [20, 26, 32];

const option = {
  number: 60,
  label: 'Jagged range',
  description:
    'Span 20 / 26 / 32 · 5-wave ridge · more zigzag and larger gaps at ground level.',
  render: () => <MountainRings spans={spans} frequency={5} />,
};

export default option;
