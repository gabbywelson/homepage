import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDocument } from 'yaml';
import config from '../gt.config.json' with { type: 'json' };

/** English owns publication and structural metadata; GT owns prose and copy.
 * @param {string[] | undefined} [onlyFiles] Optional scope for isolated tests.
 */
export function normalizeTranslations(onlyFiles) {
  let count = 0;
  for (const collection of ['blog', 'pages', 'notes']) {
    const base = join('src/content', collection);
    for (const locale of config.locales) {
      const directory = join(base, locale);
      if (!existsSync(directory)) continue;
      for (const name of readdirSync(directory, { recursive: true })) {
        if (typeof name !== 'string' || !name.endsWith('.md')) continue;
        const original = join(base, config.defaultLocale, name);
        if (!existsSync(original)) continue; // Orphans are excluded by the route builder.
        const output = join(directory, name);
        if (onlyFiles && !onlyFiles.includes(output)) continue;
        const source = splitMarkdown(readFileSync(original, 'utf8'), original);
        const translated = splitMarkdown(readFileSync(output, 'utf8'), output);
        const metadata = source.metadata.clone();
        for (const key of ['title', 'description', 'eyebrow']) {
          if (!source.metadata.has(key)) continue;
          const value = translated.metadata.get(key);
          if (typeof value !== 'string' || !value.trim())
            throw new Error(`${output}: missing translated ${key}`);
          metadata.set(key, value);
        }
        const content = `---\n${metadata.toString()}---${translated.body}`;
        if (content !== readFileSync(output, 'utf8'))
          writeFileSync(output, content);
        count++;
      }
    }
  }
  console.log(
    `Validated structural metadata in ${count} translated Markdown files.`,
  );
}

/** @param {string} content @param {string} path */
function splitMarkdown(content, path) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$/);
  if (!match?.[1] || !match[2])
    throw new Error(`${path}: missing YAML frontmatter`);
  const metadata = parseDocument(match[1]);
  if (metadata.errors.length)
    throw new Error(`${path}: invalid YAML frontmatter`);
  return { metadata, body: match[2] };
}
