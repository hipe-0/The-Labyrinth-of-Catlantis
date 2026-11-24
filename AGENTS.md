# Agent Rules

- **Always commit after changes.** After completing any code, documentation, or configuration change, stage the relevant files and create a descriptive Git commit. Do not leave the working tree dirty. Do not commit build artifacts.
- If a commit cannot be made (for example, missing Git identity or a failing required check), stop and report the blocker instead of leaving the work uncommitted.
- After every change. Explain your changes to doc/changelog.md the line should start with date in xxxx.xx.xx [AI computing time = x min] format. New entries are at the end. Computing time: please estimate how long this change took you in total

- **Test in dev before pushing to main.** Run the local dev server and/or `npm run build` on your feature branch, verify the change works, then merge to `main`. Do not push untested code directly to `main` or `gh-pages`.
- **Commit locally is fine; push is gated.** Committing after each change (per the rule above) is encouraged, but pushing to `main` is a separate step that should only happen once the change is green in dev.
- **Publish deliberately.** After a green `main`, run `deploy.sh` to push `main` → `gh-pages` (GitHub Pages). Do not force-push to `gh-pages` from an untested branch.

- **Ask user permission before pushing.** Never push to the repo on your own initiative — especially not to `main` or `gh-pages`. The user must test the change in dev first and explicitly approve the push. Human in the loop: I will wait for your go-ahead before any push.

- The developper likes simplicity and KISS keep it simple stupid. please keep your code clean and easy to update, maintain clean file structure. If bloated, clean it up. If code is mixing unrelated topics, split it clean into usable files or folders that don't overload the AI context window. If major simplifications can be made, ask user to plan this later.

## Visual change gate (mandatory)

Visual work is **preview-first**: exactly **3 numbered options** → 3 code+PNG pairs
→ explicit **“NN approved”** → game commit → playtest. Keep it lean: no sheet, no
`notes.md`, no `meta.json`, no option ledger. See `doc/VISUAL_WORKFLOW.md`.

### 1. Propose in the lab (no game files)

- Create `src/lab/proposals/<slug>/` with exactly three numbered option files:
  `<number>.jsx`, each with its `<number>.png` beside it. `index.jsx` in the same
  folder wires the baseline, camera, and the three options.
- Use the next free numbers across all proposal folders; never reuse a number.
- Capture with `npm run preview -- <slug> --open`. The PNGs land next to the code:
  `src/lab/proposals/<slug>/<number>.png`.
- Report the three numbers and three paths. Do **not** describe the proposal as
  implemented.

### 2. Wait for explicit option approval

- Treat only a clear “`NN approved`”, “go with `NN`”, or “implement `NN`” as
  approval. Silence, “interesting”, or a question is **not** approval.
- Iterate in the lab and recapture. Never edit game visuals “just to try” an
  option.
- If a commit is needed before approval, it must be **lab-only**: `src/lab/**`,
  `scripts/visual-preview.mjs`, and docs. It must not touch `src/App.js`,
  `src/MazeScene.js`, `src/components/**`, `src/config/**`, or `src/utils/**`. The
  only allowed entry-point change is the dev-only `?lab=` switch in
  `src/index.js`; the normal `<App />` path must stay intact.

### 3. Commit to the game (after approval)

- Promote **only the approved numbered variant** and the shared renderer it
  imports. Do not include either of the other two options.
- Delete the unselected numbered files and the proposal folder once the chosen
  code is in the game. The game is the source of truth.
- Add/update tests, run `CI=true npm test -- --watchAll=false` and
  `npm run build`, append the dated changelog line, then commit.
- This game commit is the “step 2” the user validates against.

### 4. Hand over for playtest

- Ask the user to run `npm start` and test the game.
- Do not push until the user explicitly approves the push (existing rule above).
