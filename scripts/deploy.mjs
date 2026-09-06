import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const wrangler = fileURLToPath(
  new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url),
);

/** @param {string[]} args */
function run(args) {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Wrangler failed: ${args.join(' ')}`);
}

// A unique tag selects exactly this upload, even if another deployment overlaps.
// Version commands never reapply custom domains or implicitly replace DNS records.
const tag = `site-${randomUUID()}`;
run(['versions', 'upload', '--tag', tag]);
run(['versions', 'deploy', '--version-tag', `${tag}@100`, '--yes']);
