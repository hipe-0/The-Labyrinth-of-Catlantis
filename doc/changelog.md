# Changelog

Entries are appended at the end. Each line starts with the date in
`yyyy.mm.dd [AI computing time = x min]` format.

2026.11.24 [AI computing time = 50 min] Added the preview-first visual workflow: a dev-only graphics lab at `?lab=<slug>`, a deterministic `npm run preview` PNG capture (agent-browser, 1600×900 @2×, reuses or starts/stops the dev server), a proposal template + registry + schema test, the `wall-openings` example proposal with `proposal.png`/`meta.json`/`notes.md`, `doc/VISUAL_WORKFLOW.md`, and a mandatory lab-only-before-approval agent rule.
2026.11.24 [AI computing time = 5 min] Linked the visual workflow from `doc/README.md` (repository layout, where-to-look table, documentation index).
2026.11.24 [AI computing time = 45 min] Reworked the visual workflow to exactly 3 globally numbered options in `src/lab/option-ledger.json` (56-58 for `wall-openings`), added `proposal:new` scaffolding, individual `<number>.png` captures plus a 3-up sheet, an “NN approved” status flow, single-option recapture, and updated the lab, tests, AGENTS gate, and docs.
2026.11.24 [AI computing time = 3 min] Clarified the approval flow: set the proposal status to approved before implementation and verified after user playtest.
2026.11.24 [AI computing time = 25 min] Added the `mountain-span` visual proposal (options 59-61): three ridged horizon height profiles centered on the current ring heights, valleys clamped to ground, previewed on an open square with no maze walls.
2026.11.24 [AI computing time = 20 min] Simplified the visual workflow to numbered code+PNG pairs in `src/lab/proposals/<slug>/`; removed the option ledger, `proposal:new`, `meta.json`, `notes.md`, and the 3-up sheet; split `wall-openings` and `mountain-span` into 56/57/58 and 59/60/61 `.jsx` + `.png` pairs.
2026.11.24 [AI computing time = 20 min] Implemented approved mountain option 60 (Jagged range) in `HorizonMountains`: ridge spans 20/26/32 centered on 7/9.5/12, frequency 5, valleys clamped to ground, white band follows the ridge with polygon offset; added `mountainHeight` tests and removed the selected proposal folder.
2026.11.24 [AI computing time = 35 min] Added the `buildings` visual proposal (options 62-64): five 1x1 sealed building cells inserted before a deterministic 10x7 maze carve, heights 1.08-2.90 against the 1.0 walls, three minimal treatments (bare towers, warm windows, alternating dark roof caps). Option 64 revised after review so building faces reuse the exact white wall material and outline. Lab only — the game is unchanged.
