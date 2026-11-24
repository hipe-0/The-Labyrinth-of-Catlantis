#!/usr/bin/env node
// scripts/new-visual-proposal.mjs
//
// Allocate the next three global option numbers and create a proposal from
// src/lab/proposals/_template.jsx.
//
//   npm run proposal:new -- my-idea "My visual idea"
//
// The numbers are recorded in src/lab/option-ledger.json and are never reused.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER_PATH = join(ROOT, 'src', 'lab', 'option-ledger.json');
const TEMPLATE_PATH = join(ROOT, 'src', 'lab', 'proposals', '_template.jsx');

const args = process.argv.slice(2);
const slug = args[0];
const title =
  args.slice(1).join(' ').trim() ||
  (slug
    ? slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '');

const fail = (message) => {
  console.error(`\n[proposal] ${message}\n`);
  process.exit(1);
};

if (!slug) {
  fail('Missing slug. Usage: npm run proposal:new -- <slug> "Title"');
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  fail('The slug must be lowercase words separated by hyphens, e.g. dark-walls.');
}

const proposalPath = join(ROOT, 'src', 'lab', 'proposals', `${slug}.jsx`);

if (existsSync(proposalPath)) {
  fail(`src/lab/proposals/${slug}.jsx already exists.`);
}

if (!existsSync(TEMPLATE_PATH)) {
  fail('src/lab/proposals/_template.jsx is missing.');
}

const ledger = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));

if (ledger.options.some((entry) => entry.proposal === slug)) {
  fail(`The ledger already has options assigned to "${slug}".`);
}

let template = readFileSync(TEMPLATE_PATH, 'utf8');
const placeholderCount = (template.match(/number: 0,/g) || []).length;

if (placeholderCount !== 3) {
  fail(
    'The template must contain exactly three "number: 0," placeholders. ' +
      `Found ${placeholderCount}.`
  );
}

const numbers = [
  ledger.nextNumber,
  ledger.nextNumber + 1,
  ledger.nextNumber + 2,
];

ledger.nextNumber += 3;
ledger.options.push(
  ...numbers.map((number) => ({
    number,
    proposal: slug,
    status: 'awaiting-review',
  }))
);

writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);

template = template.replace("id: 'replace-me'", `id: '${slug}'`);
template = template.replace(
  "title: 'Short proposal title'",
  `title: ${JSON.stringify(title)}`
);

let optionIndex = 0;
template = template.replace(/number: 0,/g, () => {
  const number = numbers[optionIndex];
  optionIndex += 1;
  return `number: ${number},`;
});

writeFileSync(proposalPath, template);

console.log(`[proposal] allocated options ${numbers.join(', ')} for ${slug}`);
console.log(`[proposal] created src/lab/proposals/${slug}.jsx`);
console.log('[proposal] next:');
console.log(`  1. Edit the baseline and the three option renders in ${slug}.jsx.`);
console.log('  2. Register it in src/lab/proposals/index.js.');
console.log(`  3. npm run preview -- ${slug} --open`);
