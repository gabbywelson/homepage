import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { normalizeTranslations } from './translation-files.mjs';

/** Reversible fixtures preserve real translations, including local edits. */
/** @type {Map<string, string | undefined>} */
const originals = new Map();
/** @param {string} path @param {string} content */
function fixture(path, content) {
  if (!originals.has(path))
    originals.set(
      path,
      existsSync(path) ? readFileSync(path, 'utf8') : undefined,
    );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}
/** @param {string[]} args @param {string} phase */
function run(args, phase) {
  const result = spawnSync('bun', args, {
    stdio: 'inherit',
    env: { ...process.env, PROFILE_TEST_PHASE: phase },
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${args.join(' ')} failed (${result.status})`);
}

try {
  if (!existsSync('src/i18n/messages/fr.json'))
    fixture(
      'src/i18n/messages/fr.json',
      readFileSync('src/i18n/messages/en.json', 'utf8'),
    );
  for (const collection of ['home', 'resume']) {
    const source = `src/content/${collection}/en`;
    for (const name of readdirSync(source, { recursive: true })) {
      if (typeof name !== 'string' || !/\.mdx?$/.test(name)) continue;
      fixture(
        `src/content/${collection}/fr/${name}`,
        // Match real GT downloads: metadata-only entries can end at the fence.
        readFileSync(join(source, name), 'utf8').trimEnd(),
      );
    }
  }
  const home = 'src/content/home/fr/index.mdx';
  fixture(
    home,
    readFileSync(home, 'utf8')
      .replace('title: "I\'m Gabby"', 'title: "Bonjour, moi c’est Gabby"')
      .replace('I’m a <Accent', 'Bonjour ! Je suis <Accent'),
  );
  const intro = 'src/content/resume/fr/intro.md';
  fixture(
    intro,
    readFileSync(intro, 'utf8').replace(
      'title: "Résumé"',
      'title: "Mon parcours"',
    ),
  );
  const company = 'src/content/resume/fr/companies/handshake.md';
  fixture(
    company,
    readFileSync(company, 'utf8')
      .replace(
        'Senior Engineer → Founding Engineer',
        'Ingénieure senior → Ingénieure fondatrice',
      )
      .replace('order: 0', 'order: 99')
      .replace('2024-10', '2020-01'),
  );
  const role = 'src/content/resume/fr/roles/handshake-founding.md';
  fixture(
    role,
    readFileSync(role, 'utf8')
      .replace(
        'Founding Engineer, Handshake AI',
        'Ingénieure fondatrice, Handshake AI',
      )
      .replace('2025-02', '2020-01')
      .replace('Rewrote the onboarding flow', 'Refonte du parcours d’accueil'),
  );
  normalizeTranslations([...originals.keys()]);
  assert.match(readFileSync(role, 'utf8'), /2025-02/);
  assert.match(readFileSync(role, 'utf8'), /Ingénieure fondatrice/);
  assert.match(readFileSync(role, 'utf8'), /Refonte du parcours/);
  assert.match(readFileSync(company, 'utf8'), /order: 0/);
  assert.match(readFileSync(company, 'utf8'), /2024-10/);
  assert.match(readFileSync(company, 'utf8'), /Ingénieure senior/);

  for (const phase of ['complete', 'partial']) {
    if (phase === 'partial') unlinkSync(role);
    run(['run', 'build'], phase);
    run(
      ['x', 'playwright', 'test', 'tests/profile-translations.spec.ts'],
      phase,
    );
  }
} finally {
  for (const [path, content] of originals) {
    if (content !== undefined) writeFileSync(path, content);
    else if (existsSync(path)) unlinkSync(path);
  }
  // Never leave fixture output available for a later release.
  const result = spawnSync('bun', ['run', 'build'], { stdio: 'inherit' });
  if (result.status !== 0) process.exitCode = 1;
}
