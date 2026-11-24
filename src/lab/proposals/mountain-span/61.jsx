// Option 61 — Dramatic skyline
import React from 'react';

import { MountainRings } from '../../mountainRing';

const spans = [24, 30, 36];

const option = {
  number: 61,
  label: 'Dramatic skyline',
  description:
    'Span 24 / 30 / 36 · 7-wave ridge · tallest peaks and deepest ground-level gaps.',
  render: () => <MountainRings spans={spans} frequency={7} />,
};

export default option;
