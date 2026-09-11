import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { normalizeTranslations } from './translation-files.mjs';

/** Temporary fixtures exercise real builds, never GT or deployment. */
/** @type {string[]} */
const created = [];
/** @param {string} path @param {string} content */
function fixture(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, { flag: 'wx' });
  created.push(path);
}
/** @param {string[]} args */
function run(args) {
  const result = spawnSync('bun', args, {
    stdio: 'inherit',
    env: { ...process.env, I18N_TEST_FIXTURES: '1' },
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
  const metadata =
    'description: Translation test\npubDate: 2020-01-01\npriorityImage: ../../../assets/garden/desk.jpeg';
  const body =
    '\n\n[Translated page](/translation-fixture/) and [Résumé](/resume/) and [English only](/translation-english-fixture/).\n\n![A desk](../../../assets/garden/desk.jpeg)\n\nA footnote[^1].\n\n[^1]: Preserved reference.\n';
  fixture(
    'src/content/pages/en/translation-english-fixture.md',
    '---\ntitle: English only\ndescription: No translation yet\n---\n\nEnglish writing.\n',
  );
  for (const locale of ['en', 'fr']) {
    fixture(
      `src/content/blog/${locale}/translation-fixture.md`,
      `---\ntitle: ${locale === 'fr' ? 'Bonjour' : 'Hello'}\n${metadata}\n---${body}`,
    );
    fixture(
      `src/content/pages/${locale}/translation-fixture.md`,
      `---\ntitle: ${locale === 'fr' ? 'Une page' : 'A page'}\ndescription: Translation test\n---\n\nA page with [a translated post](/blog/translation-fixture/).\n`,
    );
    fixture(
      `src/content/blog/${locale}/translation-draft-fixture.md`,
      `---\ntitle: Hidden draft\ndescription: Must not publish\npubDate: 2020-01-01\ndraft: true\n---\nDraft.\n`,
    );
    fixture(
      `src/content/blog/${locale}/translation-future-fixture.md`,
      `---\ntitle: Future\ndescription: Must not publish\npubDate: 2999-01-01\n---\nFuture.\n`,
    );
  }
  fixture(
    'src/content/blog/fr/translation-orphan-fixture.md',
    '---\ntitle: Orphan\ndescription: No source\npubDate: 2020-01-01\n---\nOrphan.\n',
  );
  // Prove downloaded publication metadata is restored without losing translated copy.
  const target = 'src/content/blog/fr/translation-fixture.md';
  writeFileSync(
    target,
    readFileSync(target, 'utf8').replace('2020-01-01', '2024-01-01'),
  );
  normalizeTranslations([target]);
  const normalized = readFileSync(target, 'utf8');
  if (!normalized.includes('2020-01-01') || !normalized.includes('Bonjour'))
    throw new Error(
      'Metadata normalization lost source chronology or translated text',
    );
  run(['run', 'build']);
  run(['x', 'playwright', 'test', 'tests/translations.spec.ts']);
} finally {
  for (const path of created.reverse()) unlinkSync(path);
  // Never leave fixture pages in the output that a later deployment might use.
  const result = spawnSync('bun', ['run', 'build'], { stdio: 'inherit' });
  if (result.status !== 0) process.exitCode = 1;
}
