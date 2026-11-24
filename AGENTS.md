# Agent Rules

- **Always commit after changes.** After completing any code, documentation, or configuration change, stage the relevant files and create a descriptive Git commit. Do not leave the working tree dirty. Do not commit build artifacts.
- If a commit cannot be made (for example, missing Git identity or a failing required check), stop and report the blocker instead of leaving the work uncommitted.
- After every change. Explain your changes to doc/changelog.md the line should start with date in xxxx.xx.xx [AI computing time = x min] format. New entries are at the end. Computing time: please estimate how long this change took you in total

- **Test in dev before pushing to main.** Run the local dev server and/or `npm run build` on your feature branch, verify the change works, then merge to `main`. Do not push untested code directly to `main` or `gh-pages`.
- **Commit locally is fine; push is gated.** Committing after each change (per the rule above) is encouraged, but pushing to `main` is a separate step that should only happen once the change is green in dev.
- **Publish deliberately.** After a green `main`, run `deploy.sh` to push `main` → `gh-pages` (GitHub Pages). Do not force-push to `gh-pages` from an untested branch.

- **Ask user permission before pushing.** Never push to the repo on your own initiative — especially not to `main` or `gh-pages`. The user must test the change in dev first and explicitly approve the push. Human in the loop: I will wait for your go-ahead before any push.

## Visual change gate (mandatory)

Visual work is **preview-first**: exactly **3 numbered options** → 3 option PNGs +
a 3-up sheet → explicit **“NN approved”** → game commit → playtest. See
`doc/VISUAL_WORKFLOW.md` for the full guide.

### 1. Propose in the lab (no game files)

- Every proposal has **exactly three options**, numbered globally. Allocate the
  next three numbers with `npm run proposal:new -- <slug> "Title"`; never type or
  reuse an option number by hand. The ledger is `src/lab/option-ledger.json`.
- Register the proposal in `src/lab/proposals/index.js`, keep the baseline and all
  three options on the same fixed camera, and add a `notes.md` with the option
  table, status, changes, unchanged behaviour, and open decisions.
- Capture with `npm run preview -- <slug> --open`. It writes
  `doc/proposals/<slug>/<number>.png` for each option, a `proposal.png` 3-up sheet,
  and `meta.json`.
- Report the three option numbers, the three numbered PNG paths, the sheet, and
  what changes. Do **not** describe the proposal as implemented.

### 2. Wait for explicit option approval

- Treat only a clear “`NN approved`”, “go with `NN`”, or “implement `NN`” as
  approval. Silence, “interesting”, or a question is **not** approval.
- Iterate in the lab and produce a new capture. Never edit game visuals “just to
  try” an option.
- Do not mark anything approved in the ledger until the user names an option
  number.
- If a commit is needed before approval, it must be **lab-only**: `src/lab/**`,
  `doc/proposals/**`, `scripts/visual-preview.mjs`, the `preview`/`proposal:new`
  npm scripts, and docs. It must not touch `src/App.js`, `src/MazeScene.js`,
  `src/components/**`, `src/config/**`, or `src/utils/**`. The only allowed
  entry-point change is the dev-only `?lab=` switch in `src/index.js`; the normal
  `<App />` path must stay intact.

### 3. Commit to the game (after approval)

- Mark the chosen option `approved` and the other two `not-selected` in
  `src/lab/option-ledger.json`. Record `Approved option: NN — <label>` in
  `doc/proposals/<slug>/notes.md`.
- Implement **only that option**. Do not smuggle in extra visual changes.
- Keep the proposal and all PNGs in the repo as the review record; set
  `Status: implemented — playtesting` in the notes and the ledger.
- Add/update tests, run `CI=true npm test -- --watchAll=false` and
  `npm run build`, append the dated changelog line, then commit.
- This game commit is the “step 2” the user validates against.

### 4. Hand over for playtest

- Ask the user to run `npm start` and test the game.
- Do not push until the user explicitly approves the push (existing rule above).
- After user confirmation, set the ledger and notes to `verified — user-approved`.
