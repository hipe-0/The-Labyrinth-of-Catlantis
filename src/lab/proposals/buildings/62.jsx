// Option 62 — Bare towers
import React from 'react';

import { StreetScene } from './street';

const option = {
  number: 62,
  label: 'Bare towers',
  description:
    'Plain white blocks with the wall outline. Height alone separates them from the 1.0 walls; no windows, no roof cap. Heights 1.08 · 1.55 · 2.05 · 2.35 · 2.90.',
  render: () => <StreetScene treatment="plain" />,
};

export default option;
