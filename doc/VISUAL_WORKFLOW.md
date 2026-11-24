# Visual Workflow — Three Numbered Options, One Approved

Keep it lean:

```text
3 numbered code+PNG pairs  →  you approve one number  →  that code goes into the game
```

No `proposal.png` sheet. No `notes.md`. No `meta.json`. No option ledger. The
numbered code file and its PNG sit together in the proposal folder; the PNG is the
review artifact, the code file is the thing that can be promoted.

---

## 1. Quick commands

### Interactive lab

```bat
npm start
```

```text
http://localhost:3000/The-Labyrinth-of-Catlantis/?lab=mountain-span
```

### Capture the three option PNGs

```bat
npm run preview -- mountain-span --open
```

Output, beside the code:

```text
src/lab/proposals/mountain-span/59.jsx
src/lab/proposals/mountain-span/59.png
src/lab/proposals/mountain-span/60.jsx
src/lab/proposals/mountain-span/60.png
src/lab/proposals/mountain-span/61.jsx
src/lab/proposals/mountain-span/61.png
```

`--open` opens the folder.

### Recapture one option

```bat
npm run preview -- mountain-span --option 61
```

---

## 2. Proposal folder

```text
src/lab/proposals/<slug>/
├── <number>.jsx      # one complete option
├── <number>.png      # its review image, same number
├── ...
└── index.jsx         # baseline, camera, and the three imports
```

- **Exactly three numbered options.**
- Use the next free numbers across all proposal folders; never reuse one.
- All three options share the camera and baseline from `index.jsx`.
- Each numbered file exports `{ number, label, description, render }`.
- The PNG and the code must have the same number.
- No notes/meta/sheet files. The only review artifact is the PNG; the only
  candidate code is the numbered file.

A numbered option looks like this:

```jsx
// src/lab/proposals/mountain-span/61.jsx
import React from 'react';
import { MountainRings } from '../../mountainRing';

const spans = [24, 30, 36];

const option = {
  number: 61,
  label: 'Dramatic skyline',
  description: 'Span 24 / 30 / 36 · 7-wave ridge · tallest peaks.',
  render: () => <MountainRings spans={spans} frequency={7} />,
};

export default option;
```

`index.jsx` wires the three options and the current baseline:

```jsx
import option59 from './59';
import option60 from './60';
import option61 from './61';

export default {
  id: 'mountain-span',
  title: 'Mountain silhouette height span',
  subtitle: '...',
  camera: { ... },
  baseline: { label: 'Current', render: () => <HorizonMountains /> },
  options: [option59, option60, option61],
};
```

---

## 3. Approval

When the user says **`61 approved`**:

1. Promote only `61.jsx` and the shared renderer it imports into the game.
2. Delete `59.jsx`, `60.jsx`, their PNGs, and the proposal folder once the chosen
   code is in the game. The game is the source of truth.
3. Add/update tests, run `CI=true npm test -- --watchAll=false` and
   `npm run build`, append the dated changelog line, then commit.
4. Ask the user to playtest. Do not push until the user explicitly approves.

Silence, “interesting”, or a question is not approval. If the user asks for a
tweak, edit the numbered variant and recapture that PNG.

Before approval, commits must be lab-only: `src/lab/**`,
`scripts/visual-preview.mjs`, and docs. Do not touch `src/App.js`,
`src/MazeScene.js`, `src/components/**`, `src/config/**`, or `src/utils/**`. The
only entry-point change allowed is the dev-only `?lab=` switch in `src/index.js`.

---

## 4. Why this shape

- Three options force a real design choice.
- A permanent number makes “61 approved” unambiguous.
- Code and PNG share a folder and a number, so the approved artifact is obvious.
- The other two options are deleted after the choice; no dead variants accumulate.
- No JSON/notes bookkeeping to keep in sync.

---

## 5. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Expected exactly 3 numbered .jsx files` | Add or remove files so the folder has exactly three `<number>.jsx` options |
| `Option NN is not in ...` | Use one of the numbers actually present in the folder |
| The lab did not report `window.__LAB_READY__` | Check `failed.png` in the proposal folder; open the lab URL to see the console |
| Black canvases | Run `agent-browser install`, or open the lab interactively |
| Port 3000 in use | The script reuses it; use `--port 3001` for a different server |
| PNG cropped | Use `--width`/`--height`; layouts target 1600 × 900 and up |
