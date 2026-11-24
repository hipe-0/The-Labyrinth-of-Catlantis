# Visual Workflow — Preview First, Then Touch the Game

Visual changes are reviewed as a **side-development PNG** before any game runtime
file changes. The short version:

```text
lab proposal  →  proposal.png  →  your approval  →  game commit  →  your playtest
```

This exists so art direction is cheap to explore and expensive to break: a proposal
lives in `src/lab/`, the game keeps rendering exactly what it rendered before, and
nothing is "committed to the game" until you have looked at the PNG and said yes.

---

## 1. Quick commands

### Interactive lab (live, in the browser)

```bat
npm start
```

Then open:

```text
http://localhost:3000/The-Labyrinth-of-Catlantis/?lab=wall-openings
```

The lab page has **Compare / Current / Proposed** modes and a notes section. It is
available only in the development server (`NODE_ENV=development`); the normal game
entry point is unchanged.

### Capture the review PNG

```bat
npm run preview -- wall-openings --open
```

What it does:

1. Reuses a dev server on port 3000 if one is already running, otherwise starts
   one with `BROWSER=none` and stops it afterwards.
2. Opens the lab in a headless Chromium at 1600 × 900 (2× device scale).
3. Waits for `window.__LAB_READY__ === true` (after both canvases render).
4. Writes `doc/proposals/<slug>/proposal.png` and `meta.json`.
5. Prints the absolute PNG path and, with `--open`, opens the image.

Useful options:

| Option | Purpose |
| --- | --- |
| `--open` | Open the PNG in the default image viewer |
| `--port 3001` | Use another dev-server port |
| `--width 1920 --height 1080` | Change the capture size |
| `--scale 1` | Faster capture, smaller PNG |
| `--out path.png` | Override the PNG path |
| `--keep-server` | Leave a server started by the script running |
| `--no-server` | Fail instead of starting a dev server |
| `--timeout 180000` | Allow more time for the first compile |

---

## 2. Creating a proposal

1. Copy the template:

   ```bat
   copy src\lab\proposals\_template.jsx src\lab\proposals\my-idea.jsx
   ```

2. Give it an `id` that matches the file name (`my-idea`) and a short title.

3. Define a fixed camera and at least two variants:

   - `current` — what the game does today.
   - `proposed` — the visual change. If there are several options, add
     `proposed-a`, `proposed-b`, etc.

   Both variants must use the same camera and stage so the comparison is honest.

4. Register it in `src/lab/proposals/index.js`:

   ```js
   import myIdea from './my-idea';
   export const PROPOSALS = [wallOpenings, myIdea];
   ```

5. Capture and review:

   ```bat
   npm run preview -- my-idea --open
   ```

6. Add `doc/proposals/my-idea/notes.md` with:

   - `Status: awaiting review`
   - what changes
   - what stays exactly the same
   - the decisions you need from the user

### Proposal rules

- One visual idea per proposal. A material change and a geometry change should be
  separate proposals unless the user explicitly asks for a combo.
- Use real game components where possible (`WallBox`, `SkyGradient`, `Floor`,
  `CuteCat`, etc.) so the preview matches the game's lighting and proportions.
- No pointer controls, no random layout, no animation that changes the silhouette
  between captures.
- Keep the proposal lab-only. `src/lab/**` must never be imported by
  `src/App.js`, `src/MazeScene.js`, or a game component.
- The PNG must be readable without the console: the board includes the proposal
  title, current/proposed labels, the camera-independent stage, and a "Not in
  game" footer.

The lab is wired through the dev-only `?lab=` switch in `src/index.js`. That switch
is the only entry-point change allowed for lab wiring; the normal `<App />` path
must remain untouched. The lab is lazy-loaded, so the game does not fetch it during
normal play.

### File layout

```text
src/lab/
├── GraphicsLab.jsx          # review board, routing, ready signal
├── LabStage.jsx             # fixed camera, night stage, WallBox helper
├── lab.css                  # board / panel / notes styling
└── proposals/
    ├── index.js             # registry
    ├── _template.jsx        # copy me
    └── wall-openings.jsx    # example proposal

doc/proposals/
└── <slug>/
    ├── proposal.png         # the review image
    ├── meta.json            # capture time, git branch/commit, viewport
    └── notes.md             # what changes, decisions, status
```

---

## 3. The approval gate

The workflow is deliberately strict about the word **approval**.

| User says | Agent does |
| --- | --- |
| "approved", "go", "implement it", "commit it" | Implement the approved variant in the game |
| "looks interesting", "what about…", a question | Stay in the lab and iterate; do not touch game code |
| Silence | Wait; do not treat it as approval |
| "rejected" | Update the proposal or close it; do not implement |

**Preview commits** are allowed and encouraged to keep the tree clean, but they may
only contain `src/lab/**`, `doc/proposals/**`, `scripts/visual-preview.mjs`, the
`preview` npm script, the dev-only `?lab=` switch in `src/index.js`, and
documentation. They must not contain changes to:

- `src/App.js`
- `src/MazeScene.js`
- `src/components/**`
- `src/config/gameConfig.js`
- `src/utils/**`

**Implementation commits** happen only after explicit approval. They contain the
approved visual change plus its tests, docs, and the changelog line. The lab
proposal and PNG stay in the repo as the review record.

---

## 4. After approval: implement and playtest

1. Implement the approved variant in the game. Do not add unapproved visual
   changes while you are in there.
2. Update `doc/proposals/<slug>/notes.md`:
   `Status: implemented — playtesting`.
3. Add or update tests where logic changed. Visual-only changes should at least
   keep the existing suite green.
4. Run:

   ```bat
   set CI=true
   npm test -- --watchAll=false
   npm run build
   ```

5. Append a dated line to `doc/changelog.md`.
6. Commit the game change with a descriptive message.
7. Ask the user to run `npm start` and test the game. Do **not** push until the
   user explicitly approves the push.

When the user confirms the game looks right, set
`Status: verified — user-approved` in the proposal notes.

---

## 5. Why a separate lab instead of a branch in the game?

- The game code stays stable while multiple options are explored.
- The PNG is a durable artifact that can be reviewed without a dev server.
- The same lab proposal can produce a new PNG after a tweak, so the review loop is
  short.
- The lab is lazy-loaded and dev-only, so the production bundle and the live game
  are not affected.

---

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `No proposal file at src/lab/proposals/<slug>.jsx` | Create the file from `_template.jsx` and register it in `index.js` |
| `The lab did not report window.__LAB_READY__` | Check `failed.png` in the proposal folder, then run `npm start` and open the lab URL to see the console |
| Black canvases | WebGL is unavailable in headless Chrome; run `agent-browser install` and retry, or open the lab interactively |
| `agent-browser was not found` | `npm i -g agent-browser && agent-browser install` |
| Port 3000 already in use | The script reuses it; if it is another app, use `--port 3001` |
| PNG is cropped | Use `--width`/`--height`; the board is designed for 1600 × 900 and up |
