# Visual Workflow — Three Numbered Options, Then the Game

Visual changes are reviewed as **three numbered option PNGs** before any game
runtime file changes:

```text
3 options  →  56.png / 57.png / 58.png  →  "58 approved"  →  game commit  →  playtest
```

Option numbers are **global and permanent**. “58” always means the same option,
even after more proposals are added. The ledger in `src/lab/option-ledger.json`
is the source of truth.

---

## 1. Quick commands

### Interactive lab (live, in the browser)

```bat
npm start
```

Open:

```text
http://localhost:3000/The-Labyrinth-of-Catlantis/?lab=wall-openings
```

The lab defaults to the **3-up comparison**. Use the buttons to focus one option,
or switch to **Current** to see what the game renders today.

### Capture the review PNGs

```bat
npm run preview -- wall-openings
```

Output:

```text
doc/proposals/wall-openings/56.png
doc/proposals/wall-openings/57.png
doc/proposals/wall-openings/58.png
doc/proposals/wall-openings/proposal.png   ← 3-up review sheet
doc/proposals/wall-openings/meta.json
```

Each numbered PNG has the option number large in the left rail, the option name,
the dimensions, the baseline description, and an “awaiting review” status. The
sheet is the quick side-by-side comparison.

`--open` opens the sheet (or the single option when `--option` is used).

### Recapture one option

```bat
npm run preview -- wall-openings --option 58
```

Useful after approval, to update the status to `APPROVED` without regenerating the
other two PNGs.

### Start a new proposal

```bat
npm run proposal:new -- dark-walls "Dark wall faces"
```

This allocates the next three numbers from the ledger and creates
`src/lab/proposals/dark-walls.jsx` with those numbers. Then edit the three renders,
register the proposal in `src/lab/proposals/index.js`, and capture it.

---

## 2. The option ledger

`src/lab/option-ledger.json`:

```json
{
  "nextNumber": 59,
  "options": [
    { "number": 56, "proposal": "wall-openings", "status": "awaiting-review" },
    { "number": 57, "proposal": "wall-openings", "status": "awaiting-review" },
    { "number": 58, "proposal": "wall-openings", "status": "awaiting-review" }
  ]
}
```

- **Exactly three numbers** belong to each proposal.
- Numbers are **never reused**, even if a proposal is rejected or deleted.
- Statuses: `awaiting-review`, `approved`, `implemented`, `verified`,
  `not-selected`.
- The test suite checks that the proposal numbers and the ledger agree, and that
  `nextNumber` is beyond every issued number.
- The first demo proposal uses `56, 57, 58`; the next proposal will get
  `59, 60, 61`.

---

## 3. Creating a proposal

1. Allocate numbers and scaffold the file:

   ```bat
   npm run proposal:new -- my-idea "My visual idea"
   ```

2. Edit `src/lab/proposals/my-idea.jsx`:

   - `baseline` — what the game does today.
   - three `options` — three different answers to the same visual question.
   - a fixed camera, shared by all views.
   - notes: what changes, what stays the same, what needs a decision.

3. Register it in `src/lab/proposals/index.js`.

4. Capture:

   ```bat
   npm run preview -- my-idea --open
   ```

5. Add `doc/proposals/my-idea/notes.md` with the option table, status, and the
   decision needed.

### Proposal rules

- **Exactly three numbered options.** No more, no fewer.
- All three use the **same camera and stage**; only the visual idea changes.
- The baseline is not numbered. It is the current game reference.
- One visual idea per proposal. Material and geometry changes should be separate
  proposals unless the user asks for a combo.
- Keep it lab-only. `src/lab/**` must never be imported by `src/App.js`,
  `src/MazeScene.js`, or a game component.
- Use real game components where possible (`WallBox`, `SkyGradient`, `Floor`,
  `CuteCat`, etc.) so the preview matches the game’s lighting and proportions.
- No pointer controls, no random layout, no animation that changes the silhouette
  between captures.

### File layout

```text
src/lab/
├── GraphicsLab.jsx          # board, focus view, routing, ready signal
├── LabStage.jsx             # fixed camera, night stage, WallBox helper
├── lab.css                  # board / focus / notes styling
├── option-ledger.json       # global option numbers and statuses
└── proposals/
    ├── index.js             # registry
    ├── _template.jsx        # three-option template (use proposal:new)
    └── wall-openings.jsx    # example: options 56, 57, 58

doc/proposals/
└── <slug>/
    ├── <number>.png         # one numbered review PNG per option
    ├── proposal.png         # 3-up review sheet
    ├── meta.json            # capture time, git branch/commit, viewport
    └── notes.md             # option table, decisions, status
```

The lab is wired through the dev-only `?lab=` switch in `src/index.js`. That switch
is the only entry-point change allowed for lab wiring; the normal `<App />` path
must remain untouched. The lab is lazy-loaded, so the game does not fetch it during
normal play.

---

## 4. Approval by number

The user approves an option by number:

| User says | Agent does |
| --- | --- |
| `58 approved` | Mark 58 `approved`; mark 56/57 `not-selected`; implement 58 only |
| `56 approved` | Mark 56 `approved`; mark 57/58 `not-selected`; implement 56 only |
| “Interesting, but…” | Stay in the lab and iterate; no game changes |
| A question | Answer it; no game changes |
| Silence | Wait; silence is not approval |

When an option is approved, update:

1. `src/lab/option-ledger.json` — the chosen option’s status, and the other two to
   `not-selected`.
2. The proposal file — `status: 'approved'`, so the lab header shows
   `APPROVED — READY TO IMPLEMENT`.
3. `doc/proposals/<slug>/notes.md` — `Status: approved — ready to implement`,
   `Approved option: 58 — Wide ribbon`.
4. Optionally recapture the chosen option:
   `npm run preview -- <slug> --option 58`.

**Preview commits** are allowed and encouraged to keep the tree clean, but they may
only contain `src/lab/**`, `doc/proposals/**`, `scripts/visual-preview.mjs`, the
`preview`/`proposal:new` npm scripts, the dev-only `?lab=` switch in `src/index.js`,
and documentation. They must not contain changes to:

- `src/App.js`
- `src/MazeScene.js`
- `src/components/**`
- `src/config/gameConfig.js`
- `src/utils/**`

---

## 5. After approval: implement and playtest

1. Implement the approved option in the game. Do not add unapproved visual
   changes.
2. Set the ledger status to `implemented` and the proposal notes to
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

When the user confirms the game looks right, set the proposal `status`, the ledger,
and the notes to `verified — user-approved`.

---

## 6. Why numbered options instead of “before/after”?

- Three options force a real design choice instead of a binary “yes/no”.
- A permanent number makes approval unambiguous: `58 approved` cannot be confused
  with “the second one” after the lab is reordered.
- The 3-up sheet is fast to scan; the individual numbered PNGs are the durable
  approval artifacts.
- The ledger gives an audit trail from proposal to game commit.

---

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Expected exactly 3 option numbers…` | Create proposals with `npm run proposal:new`; do not edit numbers by hand |
| `The proposal numbers … do not match the ledger` | Use the numbers assigned in `src/lab/option-ledger.json` |
| `No proposal file at src/lab/proposals/<slug>.jsx` | Run `npm run proposal:new -- <slug> "Title"` |
| The lab did not report `window.__LAB_READY__` | Check `failed.png` in the proposal folder; run `npm start` and open the lab URL to see the console |
| Black canvases | WebGL is unavailable in headless Chrome; run `agent-browser install` and retry, or open the lab interactively |
| `agent-browser was not found` | `npm i -g agent-browser && agent-browser install` |
| Port 3000 already in use | The script reuses it; if it is another app, use `--port 3001` |
| PNG is cropped | Use `--width`/`--height`; the layouts are designed for 1600 × 900 and up |
