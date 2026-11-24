# Changelog

Entries are appended at the end. Each line starts with the date in
`yyyy.mm.dd [AI computing time = x min]` format.

2026.11.24 [AI computing time = 50 min] Added the preview-first visual workflow: a dev-only graphics lab at `?lab=<slug>`, a deterministic `npm run preview` PNG capture (agent-browser, 1600×900 @2×, reuses or starts/stops the dev server), a proposal template + registry + schema test, the `wall-openings` example proposal with `proposal.png`/`meta.json`/`notes.md`, `doc/VISUAL_WORKFLOW.md`, and a mandatory lab-only-before-approval agent rule.
2026.11.24 [AI computing time = 5 min] Linked the visual workflow from `doc/README.md` (repository layout, where-to-look table, documentation index).
2026.11.24 [AI computing time = 45 min] Reworked the visual workflow to exactly 3 globally numbered options in `src/lab/option-ledger.json` (56-58 for `wall-openings`), added `proposal:new` scaffolding, individual `<number>.png` captures plus a 3-up sheet, an “NN approved” status flow, single-option recapture, and updated the lab, tests, AGENTS gate, and docs.
2026.11.24 [AI computing time = 3 min] Clarified the approval flow: set the proposal status to approved before implementation and verified after user playtest.
