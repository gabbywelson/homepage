import { readFile, writeFile } from 'node:fs/promises';

/** @type {Record<string, string>} */
const redirects = JSON.parse(
  await readFile(
    new URL('../src/data/legacy-redirects.json', import.meta.url),
    'utf8',
  ),
);

// Keep the edge's real HTTP redirects in sync with Astro's portable HTML fallback.
const rules = Object.entries(redirects).flatMap(([from, to]) => [
  `${from} ${to} 301`,
  `${from}/ ${to} 301`,
]);
await writeFile(
  new URL('../dist/_redirects', import.meta.url),
  `${rules.join('\n')}\n`,
);
