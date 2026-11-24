// Option 59 — Broad ridge
import React from 'react';

import { MountainRings } from '../../mountainRing';

const spans = [16, 20, 24];

const option = {
  number: 59,
  label: 'Broad ridge',
  description:
    'Span 16 / 20 / 24 · broad 3-wave ridge · moderate peaks, valleys clamp to the ground.',
  render: () => <MountainRings spans={spans} frequency={3} />,
};

export default option;
