import { spawnSync } from 'node:child_process';
import { normalizeTranslations } from './translation-files.mjs';

const dryRun = process.argv.includes('--dry-run');
const missing = ['GT_PROJECT_ID', 'GT_API_KEY'].filter(
  (key) => !process.env[key]?.trim(),
);
if (missing.length && !dryRun) {
  console.error(
    `Missing ${missing.join(' and ')}. Copy .env.example to .env.local and add your GT project credentials. See docs/translations.md.`,
  );
  process.exit(1);
}

// Keep translation generation separate from ordinary builds and deployment.
const result = spawnSync(
  process.execPath,
  [
    'node_modules/gt/bin/main.js',
    'translate',
    '--omit-config-ids',
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' },
);
if (result.error) throw result.error;
if (result.status === 0 && !dryRun) normalizeTranslations();
process.exit(result.status ?? 1);
