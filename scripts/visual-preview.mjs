#!/usr/bin/env node
// scripts/visual-preview.mjs
//
// Capture numbered option PNGs into the proposal folder, beside the matching
// numbered code file:
//
//   src/lab/proposals/mountain-span/59.jsx
//   src/lab/proposals/mountain-span/59.png
//
//   npm run preview -- mountain-span              # capture all three
//   npm run preview -- mountain-span --option 61  # recapture one
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_PATH = '/The-Labyrinth-of-Catlantis/';

const rawArgs = process.argv.slice(2);
const flags = new Map();
const positionals = [];
const VALUE_FLAGS = new Set([
  'port',
  'width',
  'height',
  'scale',
  'timeout',
  'option',
  'out',
]);

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];

  if (!arg.startsWith('--')) {
    positionals.push(arg);
    continue;
  }

  const [name, ...rest] = arg.slice(2).split('=');

  if (rest.length > 0) {
    flags.set(name, rest.join('='));
    continue;
  }

  const next = rawArgs[index + 1];

  if (VALUE_FLAGS.has(name) && next !== undefined && !next.startsWith('--')) {
    flags.set(name, next);
    index += 1;
    continue;
  }

  flags.set(name, true);
}

const proposalId = positionals[0];
const openResult = flags.has('open');
const keepServer = flags.has('keep-server');
const noServer = flags.has('no-server');
const port = Number(flags.get('port') || process.env.PORT || 3000);
const width = Number(flags.get('width') || 1600);
const height = Number(flags.get('height') || 900);
const scale = Number(flags.get('scale') || 2);
const timeoutMs = Number(flags.get('timeout') || 120000);
const outOverride = flags.get('out');
const requestedOption =
  flags.get('option') === undefined ? null : Number(flags.get('option'));

const sleep = (ms) =>
  new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function usage(message) {
  if (message) {
    console.error(`\n[preview] ${message}\n`);
  }

  console.error(
    [
      'Usage: npm run preview -- <proposal-folder> [options]',
      '',
      'Captures every numbered .jsx file in src/lab/proposals/<folder>/ to a',
      'PNG with the same number in the same folder.',
      '',
      'Options:',
      '  --option <number>  Capture only one option',
      '  --open             Open the proposal folder (or the single PNG)',
      '  --port <number>    Dev server port (default: 3000)',
      '  --width <px>       Viewport width (default: 1600)',
      '  --height <px>      Viewport height (default: 900)',
      '  --scale <number>   Device scale factor (default: 2)',
      '  --out <path>       Override the PNG path (requires --option)',
      '  --timeout <ms>     Maximum wait per capture (default: 120000)',
      '  --no-server        Fail instead of starting a dev server',
      '  --keep-server      Leave a dev server started by this script running',
      '',
      'Example:',
      '  npm run preview -- mountain-span --open',
    ].join('\n')
  );
}

for (const [name, value] of Object.entries({
  port,
  width,
  height,
  scale,
  timeout: timeoutMs,
})) {
  if (!Number.isFinite(value) || value <= 0) {
    usage(`--${name} must be a positive number.`);
    process.exit(1);
  }
}

if (requestedOption !== null) {
  if (!Number.isInteger(requestedOption) || requestedOption <= 0) {
    usage('--option must be a positive option number.');
    process.exit(1);
  }
}

if (outOverride === true) {
  usage('--out needs a path.');
  process.exit(1);
}

if (outOverride && requestedOption === null) {
  usage('--out can only be used together with --option.');
  process.exit(1);
}

if (!proposalId) {
  usage('Missing proposal folder name.');
  process.exit(1);
}

const proposalDir = join(ROOT, 'src', 'lab', 'proposals', proposalId);

if (!existsSync(proposalDir)) {
  usage(`No proposal folder at src/lab/proposals/${proposalId}.`);
  process.exit(1);
}

const numberedOptions = readdirSync(proposalDir)
  .map((file) => file.match(/^(\d+)\.jsx$/))
  .filter(Boolean)
  .map((match) => Number(match[1]))
  .sort((a, b) => a - b);

if (numberedOptions.length !== 3) {
  usage(
    `Expected exactly 3 numbered .jsx files in src/lab/proposals/${proposalId}, ` +
      `found ${numberedOptions.length}.`
  );
  process.exit(1);
}

if (requestedOption !== null && !numberedOptions.includes(requestedOption)) {
  usage(
    `Option ${requestedOption} is not in src/lab/proposals/${proposalId}. ` +
      `Available: ${numberedOptions.join(', ')}.`
  );
  process.exit(1);
}

const numbersToCapture =
  requestedOption === null ? numberedOptions : [requestedOption];

const pngPathFor = (number) => {
  if (outOverride && number === numbersToCapture[0]) {
    return resolve(ROOT, outOverride);
  }

  return join(proposalDir, `${number}.png`);
};

let agentBrowserPath = null;

function resolveAgentBrowser() {
  if (agentBrowserPath) {
    return agentBrowserPath;
  }

  const candidates = [];

  if (process.platform === 'win32' && process.env.APPDATA) {
    candidates.push(
      join(
        process.env.APPDATA,
        'npm',
        'node_modules',
        'agent-browser',
        'bin',
        `agent-browser-${process.platform}-${process.arch}.exe`
      )
    );
  }

  candidates.push('agent-browser');

  for (const candidate of candidates) {
    if (candidate === 'agent-browser' || existsSync(candidate)) {
      agentBrowserPath = candidate;
      return agentBrowserPath;
    }
  }

  throw new Error(
    'agent-browser was not found. Install it with:\n' +
      '  npm i -g agent-browser && agent-browser install'
  );
}

function agent(args, { timeout = 120000 } = {}) {
  // agent-browser's daemon keeps inherited stdio handles open, so piping output
  // makes spawnSync wait for the full timeout. Rely on the exit code instead.
  const result = spawnSync(resolveAgentBrowser(), args, {
    stdio: 'ignore',
    timeout,
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `agent-browser ${args.slice(0, 3).join(' ')} failed with exit code ${result.status}.`
    );
  }
}

function safeAgent(args, options) {
  try {
    agent(args, options);
    return true;
  } catch {
    return false;
  }
}

async function probe(baseUrl) {
  try {
    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(3000),
    });
    const html = await response.text();
    return response.ok && html.includes('id="root"');
  } catch {
    return false;
  }
}

async function findBaseUrl() {
  for (const base of [
    `http://localhost:${port}${BASE_PATH}`,
    `http://localhost:${port}/`,
  ]) {
    if (await probe(base)) {
      return base;
    }
  }

  return null;
}

let activeServer = null;

function startDevServer() {
  const env = {
    ...process.env,
    BROWSER: 'none',
    PORT: String(port),
    CI: '',
  };

  const command =
    process.platform === 'win32'
      ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm start'], {
          cwd: ROOT,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        })
      : spawn('npm', ['start'], {
          cwd: ROOT,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

  let log = '';
  const record = (chunk) => {
    log = (log + chunk.toString()).slice(-16000);
  };

  command.stdout?.on('data', record);
  command.stderr?.on('data', record);

  return { child: command, getLog: () => log };
}

function stopDevServer(server) {
  if (!server || keepServer) {
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
  } else {
    server.child.kill('SIGTERM');
  }
}

function openFile(path) {
  if (process.platform === 'win32') {
    spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'start', '', path], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();
  } else if (process.platform === 'darwin') {
    spawn('open', [path], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('xdg-open', [path], { detached: true, stdio: 'ignore' }).unref();
  }
}

function waitForLab(session) {
  return safeAgent(
    [
      '--session',
      session,
      'wait',
      '--fn',
      'window.__LAB_READY__ === true',
    ],
    { timeout: timeoutMs }
  );
}

async function main() {
  let server = null;
  let baseUrl = await findBaseUrl();

  if (!baseUrl) {
    if (noServer) {
      throw new Error(
        `No dev server answered on port ${port}. Start npm start first, or drop --no-server.`
      );
    }

    console.log(`[preview] starting dev server on port ${port}…`);
    server = startDevServer();
    activeServer = server;

    const deadline = Date.now() + 120000;

    while (Date.now() < deadline) {
      baseUrl = await findBaseUrl();

      if (baseUrl) {
        break;
      }

      if (server.child.exitCode !== null) {
        break;
      }

      await sleep(1000);
    }

    if (!baseUrl) {
      const tail = server.getLog().trim();
      throw new Error(
        'The dev server did not become ready.' +
          (tail ? `\n\nLast server output:\n${tail}` : '')
      );
    }
  }

  console.log(`[preview] dev server: ${baseUrl}`);
  console.log(`[preview] folder:     ${proposalDir}`);
  console.log(`[preview] options:    ${numberedOptions.join(', ')}`);
  console.log(`[preview] viewport:   ${width}×${height} @${scale}x`);

  const session = `catlantis-preview-${proposalId}`
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 60);
  const failedPath = join(proposalDir, 'failed.png');

  safeAgent(['--session', session, 'close']);
  agent(['--session', session, 'open', 'about:blank']);
  agent([
    '--session',
    session,
    'set',
    'viewport',
    String(width),
    String(height),
    String(scale),
  ]);

  for (const number of numbersToCapture) {
    const url = new URL(baseUrl);
    url.searchParams.set('lab', proposalId);
    url.searchParams.set('option', String(number));
    url.searchParams.set('shot', '1');
    url.searchParams.set('t', String(Date.now()));
    const pngPath = pngPathFor(number);

    mkdirSync(dirname(pngPath), { recursive: true });
    agent(['--session', session, 'open', url.toString()]);

    if (!waitForLab(session)) {
      safeAgent(['--session', session, 'screenshot', failedPath]);
      safeAgent(['--session', session, 'close']);
      throw new Error(
        `The lab did not report window.__LAB_READY__ for option ${number}.` +
          `\nA failure screenshot was saved to ${failedPath}.`
      );
    }

    agent(['--session', session, 'screenshot', pngPath]);
    console.log(`[preview] option ${number}: ${pngPath}`);
  }

  safeAgent(['--session', session, 'close']);
  stopDevServer(server);

  console.log('\n[preview] Done. The game is untouched until an option is approved.');

  if (openResult) {
    openFile(requestedOption === null ? proposalDir : pngPathFor(requestedOption));
  }

  if (server && keepServer) {
    console.log(`[preview] Dev server left running at ${baseUrl}`);
  }
}

process.on('SIGINT', () => {
  stopDevServer(activeServer);
  process.exit(130);
});

try {
  await main();
} catch (error) {
  stopDevServer(activeServer);
  console.error(`\n[preview] ${error.message}\n`);
  process.exitCode = 1;
}
