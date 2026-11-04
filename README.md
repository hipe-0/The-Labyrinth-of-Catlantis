# The Labyrinth of Catlantis


Our vibe-coded game of finding cats in a labyrinth is here.

Author: Hippolyte Mounier
Code: Claude AI

Use arrow keys to move
Use space bar to jump

Run it : https://hipe-0.github.io/The-Labyrinth-of-Catlantis/

## Run locally

Double-click `Start Game.bat` (Windows), or run `npm install` then `npm start`.

### Temporary build artefacts

`node_modules/` and `build/` are local build artefacts: they are git-ignored, not part of the repository, and can be deleted at any time for archival or cleanup. Rebuild them later with:

- `npm install` — recreates `node_modules/` from `package.json` / `package-lock.json`
- `npm run build` — recreates `build/` for production deployment

Only the source files (under `src/`, `public/`, `doc/`) and the lockfile need to be backed up or committed.

## Documentation

See [doc/README.md](doc/README.md) for the code structure, architecture, file reference,
running/deploying instructions, and known issues.
