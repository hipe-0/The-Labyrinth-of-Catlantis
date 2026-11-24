#!/usr/bin/env node
// scripts/visual-preview.mjs
//
// Capture the numbered review PNGs for a visual proposal.
//
//   npm run preview -- wall-openings            # 56.png, 57.png, 58.png + sheet
//   npm run preview -- wall-openings --option 58
//
// Each proposal has exactly three globally numbered options. The numbers are
// assigned by `npm run proposal:new` and recorded in src/lab/option-ledger.json;
// they are never reused. The output is:
//   doc/proposals/<slug>/<number>.png
//   doc/proposals/<slug>/proposal.png   (3-up review sheet)
//   doc/proposals/<slug>/meta.json
import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_BASE_PATH = '/The-Labyrinth-of-Catlantis/';
const LEDGER_PATH = join(ROOT, 'src', 'lab', 'option-ledger.json');

const rawArgs = process.argv.slice(2);
const flags = new Map();
const positionals = [];
const VALUE_FLAGS = new Set([
  'port',
  'width',
  'height',
  'scale',
  'timeout',
  'out',
  'option',
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
const openPng = flags.has('open');
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

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function usage(message) {
  if (message) {
    console.error(`\n[preview] ${message}\n`);
  }

  console.error(
    [
      'Usage: npm run preview -- <proposal-id> [options]',
      '',
      'Captures all three numbered options plus a 3-up sheet by default.',
      '',
      'Options:',
      '  --option <number>  Capture only one option (for example --option 58)',
      '  --open             Open the sheet (or the single option) when done',
      '  --port <number>    Dev server port (default: 3000)',
      '  --width <px>       Viewport width (default: 1600)',
      '  --height <px>      Viewport height (default: 900)',
      '  --scale <number>   Device scale factor (default: 2)',
      '  --out <path>       Override the PNG path (requires --option)',
      '  --timeout <ms>     Maximum wait per capture (default: 120000)',
      '  --no-server        Fail instead of starting a dev server',
      '  --keep-server      Leave a dev server started by this script running',
      '',
      'Examples:',
      '  npm run preview -- wall-openings --open',
      '  npm run preview -- wall-openings --option 58',
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
  usage('Missing proposal id.');
  process.exit(1);
}

const proposalFile = join(ROOT, 'src', 'lab', 'proposals', `${proposalId}.jsx`);

if (!existsSync(proposalFile)) {
  const available = existsSync(join(ROOT, 'src', 'lab', 'proposals'))
    ? readdirSync(join(ROOT, 'src', 'lab', 'proposals'))
        .filter((file) => file.endsWith('.jsx') && !file.startsWith('_'))
        .map((file) => file.replace(/\.jsx$/, ''))
    : [];

  usage(
    `No proposal file at src/lab/proposals/${proposalId}.jsx` +
      (available.length > 0 ? `\nAvailable: ${available.join(', ')}` : '')
  );
  process.exit(1);
}

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
  // agent-browser's daemon keeps inherited stdio handles open. Piping output
  // makes spawnSync wait for the full timeout even though the CLI has exited,
  // so pass the handles to NUL and rely on the exit code.
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
  const candidates = [
    `http://localhost:${port}${DEFAULT_BASE_PATH}`,
    `http://localhost:${port}/`,
  ];

  for (const candidate of candidates) {
    if (await probe(candidate)) {
      return candidate;
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

  let child;

  if (process.platform === 'win32') {
    child = spawn(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', 'npm start'],
      {
        cwd: ROOT,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }
    );
  } else {
    child = spawn('npm', ['start'], {
      cwd: ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  let log = '';
  const record = (chunk) => {
    log = (log + chunk.toString()).slice(-16000);
  };

  child.stdout?.on('data', record);
  child.stderr?.on('data', record);

  return {
    child,
    getLog: () => log,
  };
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

function gitValue(args) {
  const result = spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    windowsHide: true,
  });

  return result.status === 0 ? result.stdout.trim() : '';
}

function readProposalField(source, key) {
  const match = source.match(
    new RegExp(`\\b${key}:\\s*(['"\`])([\\s\\S]*?)\\1`)
  );

  return match ? match[2] : '';
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

function captureUrl(baseUrl, option) {
  const url = new URL(baseUrl);
  url.searchParams.set('lab', proposalId);

  if (option) {
    url.searchParams.set('option', String(option));
  }

  url.searchParams.set('shot', '1');
  url.searchParams.set('t', String(Date.now()));

  return url;
}

async function main() {
  const outputDir = join(ROOT, 'doc', 'proposals', proposalId);
  mkdirSync(outputDir, { recursive: true });

  const proposalSource = readFileSync(proposalFile, 'utf8');
  const proposalTitle =
    readProposalField(proposalSource, 'title') || proposalId;
  const proposalStatus =
    readProposalField(proposalSource, 'status') || 'awaiting-review';

  const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));
  const ledgerOptions = ledger.options
    .filter((entry) => entry.proposal === proposalId)
    .sort((a, b) => a.number - b.number);

  if (ledgerOptions.length !== 3) {
    throw new Error(
      `Expected exactly 3 option numbers for "${proposalId}" in ` +
        `src/lab/option-ledger.json, found ${ledgerOptions.length}. ` +
        'Create proposals with npm run proposal:new.'
    );
  }

  const optionNumbers = ledgerOptions.map((entry) => entry.number);
  const sourceNumbers = [
    ...new Set(
      [...proposalSource.matchAll(/\bnumber:\s*(\d+)\s*,/g)].map((match) =>
        Number(match[1])
      )
    ),
  ].sort((a, b) => a - b);

  if (
    sourceNumbers.length !== optionNumbers.length ||
    sourceNumbers.some((number, index) => number !== optionNumbers[index])
  ) {
    throw new Error(
      `The proposal numbers (${sourceNumbers.join(', ') || 'none'}) do not match ` +
        `the ledger (${optionNumbers.join(', ')}). Use the numbers assigned by ` +
        'npm run proposal:new.'
    );
  }

  if (requestedOption !== null && !optionNumbers.includes(requestedOption)) {
    throw new Error(
      `Option ${requestedOption} is not assigned to "${proposalId}". ` +
        `Available: ${optionNumbers.join(', ')}.`
    );
  }

  const numbersToCapture =
    requestedOption === null ? optionNumbers : [requestedOption];

  if (outOverride && numbersToCapture.length !== 1) {
    throw new Error('--out requires --option.');
  }

  const pngPathFor = (number) => {
    if (outOverride && number === numbersToCapture[0]) {
      return resolve(ROOT, outOverride);
    }

    return join(outputDir, `${number}.png`);
  };

  const sheetPath = join(outputDir, 'proposal.png');
  const metaPath = join(outputDir, 'meta.json');
  const failedPath = join(outputDir, 'failed.png');

  for (const number of numbersToCapture) {
    mkdirSync(dirname(pngPathFor(number)), { recursive: true });
  }

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

    const serverDeadline = Date.now() + 120000;

    while (Date.now() < serverDeadline) {
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
  console.log(`[preview] proposal:   ${proposalId}`);
  console.log(`[preview] options:    ${optionNumbers.join(', ')}`);
  console.log(`[preview] viewport:   ${width}×${height} @${scale}x`);

  const session = `catlantis-preview-${proposalId}`
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 60);

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

  const capture = (option) => {
    const url = captureUrl(baseUrl, option);
    agent(['--session', session, 'open', url.toString()]);

    if (!waitForLab(session)) {
      safeAgent(['--session', session, 'screenshot', failedPath]);
      throw new Error(
        `The lab did not report window.__LAB_READY__ for ` +
          `${option ? `option ${option}` : 'the 3-up sheet'}.` +
          `\nA failure screenshot was saved to ${failedPath}.` +
          '\nOpen the lab URL directly in a browser to see the console.'
      );
    }

    return url;
  };

  const captured = [];

  for (const number of numbersToCapture) {
    const url = capture(number);
    const pngPath = pngPathFor(number);
    agent(['--session', session, 'screenshot', pngPath]);
    captured.push({ number, pngPath, url });
    console.log(`[preview] option ${number}:  ${pngPath}`);
  }

  let sheetUrl = null;

  if (requestedOption === null) {
    sheetUrl = capture(null);
    agent(['--session', session, 'screenshot', sheetPath]);
    console.log(`[preview] sheet:       ${sheetPath}`);
  }

  safeAgent(['--session', session, 'close']);
  stopDevServer(server);

  let previousMeta = null;

  if (existsSync(metaPath)) {
    try {
      previousMeta = JSON.parse(readFileSync(metaPath, 'utf8'));
    } catch {
      previousMeta = null;
    }
  }

  const relativePath = (path) =>
    path.startsWith(ROOT)
      ? path.slice(ROOT.length + 1).replaceAll('\\', '/')
      : path;

  const optionRecords = ledgerOptions.map((entry) => {
    const pngPath = pngPathFor(entry.number);
    const previous = previousMeta?.options?.find(
      (option) => option.number === entry.number
    );

    return {
      number: entry.number,
      status: entry.status,
      png: existsSync(pngPath)
        ? relativePath(pngPath)
        : previous?.png ?? relativePath(pngPath),
    };
  });

  const primaryPng =
    requestedOption === null ? sheetPath : pngPathFor(requestedOption);
  const sheetRecord =
    requestedOption === null
      ? relativePath(sheetPath)
      : previousMeta?.sheet ?? (existsSync(sheetPath) ? relativePath(sheetPath) : null);

  const meta = {
    proposal: proposalId,
    title: proposalTitle,
    status: proposalStatus,
    capturedAt: new Date().toISOString(),
    viewport: { width, height, scale },
    options: optionRecords,
    sheet: sheetRecord,
    png: relativePath(primaryPng),
    labUrl: (sheetUrl ?? captured[0].url).toString(),
    git: {
      branch: gitValue(['rev-parse', '--abbrev-ref', 'HEAD']),
      commit: gitValue(['rev-parse', '--short', 'HEAD']),
    },
  };

  writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

  console.log(`[preview] meta:        ${metaPath}`);
  console.log(
    '\n[preview] Done. Reply with the option number you approve (for example "58 approved").'
  );

  if (openPng) {
    openFile(primaryPng);
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
