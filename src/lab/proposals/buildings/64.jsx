// Option 64 — Capped roofs
import React from 'react';

import { StreetScene } from './street';

const option = {
  number: 64,
  label: 'Capped roofs',
  description:
    'Building faces use the same white material and white edge as every maze wall. Only the dark shallow roof cap (flat slab / pyramid) separates them. Heights 1.08 · 1.55 · 2.05 · 2.35 · 2.90.',
  render: () => <StreetScene treatment="roofs" />,
};

export default option;
