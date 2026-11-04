# Agent Rules

- **Always commit after changes.** After completing any code, documentation, or configuration change, stage the relevant files and create a descriptive Git commit. Do not leave the working tree dirty. Do not commit build artifacts.
- If a commit cannot be made (for example, missing Git identity or a failing required check), stop and report the blocker instead of leaving the work uncommitted.

- **Test in dev before pushing to main.** Run the local dev server and/or `npm run build` on your feature branch, verify the change works, then merge to `main`. Do not push untested code directly to `main` or `gh-pages`.
- **Commit locally is fine; push is gated.** Committing after each change (per the rule above) is encouraged, but pushing to `main` is a separate step that should only happen once the change is green in dev.
- **Publish deliberately.** After a green `main`, run `deploy.sh` to push `main` → `gh-pages` (GitHub Pages). Do not force-push to `gh-pages` from an untested branch.
