import { execFileSync } from 'node:child_process';

const repository = 'https://github.com/gabbywelson/homepage';

function getBuildCommit(): string | undefined {
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^[0-9a-f]{40}$/.test(commit) ? commit : undefined;
  } catch {
    // Source archives can still build without Git metadata.
    return undefined;
  }
}

// Evaluated during Astro's build; the deployed HTML keeps this exact revision.
const commit = getBuildCommit();
export const source = {
  href: commit ? `${repository}/commit/${commit}` : repository,
  shortCommit: commit?.slice(0, 7),
};
