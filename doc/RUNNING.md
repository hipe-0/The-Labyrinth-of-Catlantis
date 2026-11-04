# Running, Building, and Deploying

## Requirements

| Tool | Recommended | Notes |
| --- | --- | --- |
| Node.js | 18 LTS or 20 LTS | This machine currently has **v24.18.0**, and the production build succeeds with it. If CRA misbehaves, switch to Node 20 via nvm-windows. |
| npm | 9+ | This machine has **11.16.0**. |
| Browser | Chrome / Edge / Firefox | WebGL 2 required. |

`node_modules/` is already installed in this working copy. A fresh clone needs
`npm install`.

---

## Launcher

Double-click **`Start Game.bat`** in the project root.

What it does:

1. Moves to the project directory (`cd /d "%~dp0"`).
2. Checks that `node` is on `PATH`; if not, prints a message and pauses.
3. If `node_modules\react-scripts` is missing, runs `npm install`.
4. Runs `npm start`.
5. Leaves the window open after the server stops.

Create React App's dev server opens <http://localhost:3000> automatically. If it does
not, open that URL manually.

---

## Manual commands

Run these from the project root in PowerShell, Command Prompt, or Git Bash.

### Install

```bat
npm install
```

### Development server

```bat
npm start
```

- CRA prints the exact URL. With the current `homepage` it serves the app under
  <http://localhost:3000/The-Labyrinth-of-Catlantis/>.
- Hot reload on file save.
- `Ctrl+C` stops the server.
- To use another port: `set PORT=3001 && npm start` (cmd) or
  `$env:PORT=3001; npm start` (PowerShell).

### Production build

```bat
npm run build
```

Output goes to `build/`. The bundle is minified and content-hashed. Because
`package.json` has a `homepage` field, asset URLs are prefixed with
`/The-Labyrinth-of-Catlantis/`.

To preview the production build locally, serve it over HTTP (opening `index.html`
directly will not work because of absolute asset paths). For example:

```bat
npx serve -s build
```

(`serve` is not currently a dependency; `npx` downloads it on demand.)

### Tests

```bat
npm test
```

Starts Jest in watch mode. The tests cover Enter/Space start keys, spawn orientation,
fractal ring generation, continuous hold rotation, circle collision/wall sliding, cat
pickup, and the silent audio fallback. `src/setupTests.js` registers jest-dom matchers.
For CI-style runs:

```bat
set CI=true
npm test -- --watchAll=false
```

### Deploy to GitHub Pages

```bat
npm run deploy
```

This runs `predeploy` (`npm run build`) first, then uses the `gh-pages` package to push
the contents of `build/` to the `gh-pages` branch of
`https://github.com/hipe-0/The-Labyrinth-of-Catlantis`.

Requirements:

- Push access to the repository.
- Git credentials configured (HTTPS token or SSH).
- The `homepage` field in `package.json` must match the Pages URL.

Live URL: <https://hipe-0.github.io/The-Labyrinth-of-Catlantis/>

### Alternative deploy script

`deploy.sh` does the same thing with raw Git commands and a force-push over SSH:

```bash
bash deploy.sh
```

Use it from Git Bash or WSL. It requires an SSH key registered with GitHub. Prefer
`npm run deploy` on Windows; the bash script is a legacy alternative.

---

## What runs where

```text
npm start ──► webpack dev server (memory) ──► http://localhost:3000/The-Labyrinth-of-Catlantis/
npm run build ──► build/ (static files)
npm run deploy ──► build/ ──► gh-pages branch ──► GitHub Pages
```

`build/` is git-ignored. It is generated output, not source. The copy currently in the
folder is from an older build; regenerate it before deploying.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `'node' is not recognized` | Node.js not installed or not on PATH | Install Node LTS from nodejs.org, reopen the terminal |
| `'npm' is not recognized` | Same as above | Reinstall Node (npm ships with it) |
| `Port 3000 is already in use` | Another dev server is running | Stop it, or `set PORT=3001 && npm start` |
| Blank/black page after Start | WebGL or a runtime error | Open DevTools (F12) → Console; check for `THREE`/R3F errors |
| `Module not found` after pulling | `node_modules` out of date | `npm install` |
| Build fails with odd dependency errors | Stale install | Delete `node_modules` and `package-lock.json`, then `npm install` (last resort) |
| Browser does not open automatically | CRA could not launch it | Open <http://localhost:3000> manually |
| GitHub Pages shows 404 | Wrong `homepage`, or `gh-pages` not published | Check `package.json` homepage and the repo's Pages settings |
| Assets 404 on Pages | `homepage` missing the repo name | Set `homepage` to the full Pages URL and rebuild |
| `npm run deploy` asks for credentials | Git auth not configured | Configure a GitHub token or SSH key |
| `deploy.sh` fails at `git push` | No SSH key / wrong remote | Use `npm run deploy`, or add an SSH key |
| Touch buttons do nothing or feel laggy | Old build used `w/a/s/d` and React state updates | Fixed; rebuild/redeploy and use the current build |
| Cannot finish the level | Old build used exact float equality in `checkExit` | Fixed; rebuild/redeploy and use the current build |

---

## Environment notes for this copy

- Working directory: `C:\Users\mouni\Desktop\2026-03-26 Maze game - The-Labyrinth-of-Catlantis`
- Branch: `Touch-control` — local only, **no upstream and not present on GitHub**
- HEAD: see `git log`; all game work is committed on `Touch-control` (ahead of
  `origin/main` at `258f564`)
- Working tree: clean after the 2026-11-04 commit
- `npm run build` was verified successfully while writing this documentation
  (compiled with warnings only about old Browserslist data)
- `npm start` was verified successfully on a local dev server: compiled and returned
  HTTP 200
- Touch controls were verified in Chrome device emulation:
  - Portrait (iPhone 15, 393×852): D-pad sits at the bottom; buttons are about 78 px;
    forward/backward movement works; holding a turn button rotates continuously and
    stops on release; the jump arc peaks around 0.77 units
  - Landscape (844×390): canvas fills the viewport, `scrollY` is 0, document scroll
    height is 390, body background is black, and there is no white band
- Touch input now writes to refs and is applied in `useFrame`; pressing a button does
  not re-render the 3D scene
- Rotation is time-based at ~250°/s while a turn key is held; the target moves
  continuously and snaps to 45° on release, so a 144 Hz PC and a 60 Hz phone use the
  same turn rate without stop-start hiccups
- The directional moonlight follows the moon's world position, clamped to a minimum
  height; the 20×20 shadow zone follows the player and refreshes every frame while
  walking, then at 5 Hz while standing still
- Movement uses fixed `1/144 s` substeps; simulated speed is **3.6 units/s** at 30, 60,
  90, 120, 144, and 240 Hz. The player is a 0.2-unit circle and slides along wall boxes.
- Audio is procedural: footsteps follow actual travel, wind follows speed, a soft bell
  rings only near the exit with stereo direction, and cats meow on pickup.
- Floor receives and casts shadows; the follow-player shadow map is `2048²` over a
  20×20 world-unit area
- Wall scale variations were verified stable across touch-triggered re-renders
- `build/` and `node_modules/` are generated/ignored

### Git remote status (verified 2026-11-02)

| Ref | Commit | Status |
| --- | --- | --- |
| `origin/main` | `258f564` | Remote default branch; matches local `Touch-control` HEAD |
| `origin/gh-pages` | `1f41a2c` | Deployed build from 2025-04-01; live site serves this |
| local `main` | `32fb27f` | **Ahead 1**, unpushed: "shading trial, not working" |
| local `Touch-control` | current HEAD | No upstream; all game work committed |
| `add-smooth-keyboard-controls` | `e332a55` | Local only, 2 commits not on any remote |
| `Experimental-Shading-trial,-to-continue-later` | `32fb27f` | Local only, same experimental commit as `main` |
| `split-files` | `7d24b4c` | Local only, already merged into `origin/main` |

The remote has only `main` and `gh-pages`; `Touch-control` does not exist there.

Other repository observations:

- No CI workflow, no `LICENSE`, no `.nvmrc`, and no `engines` field. Jest tests exist.
- `npm audit` reports **69 vulnerabilities** (4 critical, 32 high, 14 moderate,
  19 low), almost entirely transitive dependencies of the CRA 5 build toolchain.
  The critical packages are `form-data`, `proxy-addr`, `shell-quote`, and
  `websocket-driver`; they are build/dev-server dependencies, not app runtime code.
- The live site returns HTTP 200 but is built from `gh-pages` at `1f41a2c`
  (2025-04-01) and still has the `<title>React App</title>` placeholder.
